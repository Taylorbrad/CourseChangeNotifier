/**
 * @file: This file contains functions that aid the runnable
 * files, but that don't call the api or edit the database
 *
 */

import {
  connectDBClient,
  doesClassExistInDB,
  initializeTables,
  insertCourseIntoStudentTable,
  insertNewCourseIntoCourses,
  insertStudentIntoCourseTable,
  select,
  setDBParams
} from './database.js'

import promptSync from 'prompt-sync'
import { getAllCourses, getClassByID, setBearerToken } from './api_calls.js'
import { OAuth2Client } from 'google-auth-library'
import http from 'http'
import url from 'url'
import open from 'open'
import destroyer from 'server-destroy'
import nodemailer from 'nodemailer'
import AWS from 'aws-sdk'
import inquirer from 'inquirer'
import { listOfDepartments } from './parse.js'
import fuzzy from 'fuzzy'

const iPrompt = inquirer.createPromptModule()
const prompt = promptSync({ sigint: true })
AWS.config.update({ region: 'us-west-2' })
const ssm = new AWS.SSM()

let studentID
let listOfCourseNums

/**
 * This is a setter function for the global variable listOfCourseNums
 *
 * @param newVal {[]}
 * @returns none
 */
export function setListOfCourseNums (newVal) {
  listOfCourseNums = newVal
}

/**
 * Gets a set of parameters from AWS Parameter store according to the
 * strings passed in the array parameter.
 *
 * @param paramArray {string[]}
 * @returns none
 */
export async function getAWSParams (paramArray) {
  const PSParams = paramArray.reduce((acc, cur) => {
    acc.Names.push('/bradshaw-technical-challenge/dev/' + cur)
    return acc
  },
  {
    Names: [
    ],
    WithDecryption: true
  }
  )

  const fromAWS = await ssm.getParameters(PSParams).promise()

  const credsFromPS = fromAWS.Parameters.reduce((acc, cur) => {
    const keys = Object.keys(cur)

    const split = cur[keys[0]].split('/')

    const name = split[split.length - 1]

    acc[name] = cur.Value

    return acc
  }, {})

  return credsFromPS
}

/**
 * Create a new OAuth2Client, and go through the OAuth2 content
 * workflow.  Return the full client to the callback.
 *
 * @return {object} object with OAuth2 tokens for sending emails from a gmail account
 */
export function getAuthenticatedClient () {
  return new Promise(async (resolve, reject) => {
    const keys = await getAWSParams(['G_CLIENT_ID', 'G_CLIENT_SECRET'])
    // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
    // which should be downloaded from the Google Developers Console.
    const oAuth2Client = new OAuth2Client(
      keys.G_CLIENT_ID,
      keys.G_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    )

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://mail.google.com'
    })

    // Open an http server to accept the oauth callback. In this simple example, the
    // only request to our webserver is to /oauth2callback?code=<code>
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            // acquire the code from the querystring, and close the web server.
            const qs = new url.URL(req.url, 'http://localhost:3000')
              .searchParams
            const code = qs.get('code')
            res.end('Authentication successful! Please return to the console.')
            server.destroy()

            // Now that we have the code, use that to acquire tokens.
            const r = await oAuth2Client.getToken(code)
            // Make sure to set the credentials on the OAuth2 client.
            oAuth2Client.setCredentials(r.tokens)
            resolve(oAuth2Client)
          }
        } catch (e) {
          reject(e)
        }
      })
      .listen(3000, () => {
        // open the browser to the authorize url to start the workflow
        open(authorizeUrl, { wait: false }).then(cp => cp.unref())
      })
    destroyer(server)
  })
}

/**
 * Send a given string as an email to a given recipient
 *
 * @param recipientEmail {string}
 * @param emailBody {string}
 * @param refreshTokenOAuth2 {object}
 * @return none
 */
export async function sendEmail (recipientEmail, emailBody, refreshTokenOAuth2) {
  const mailOptions = {

    from: "Taylor's app <coursechangenotifier@gmail.com>",
    to: recipientEmail,
    subject: 'Course Change Notification',
    text: emailBody
  }

  const keys = await getAWSParams(['G_CLIENT_ID', 'G_CLIENT_SECRET'])

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'coursechangenotifier@gmail.com',
      clientId: keys.G_CLIENT_ID,
      clientSecret: keys.G_CLIENT_SECRET,
      refreshToken: refreshTokenOAuth2
    }
  })

  await transport.sendMail(mailOptions)
}

/**
 * Displays a message (based on the input string), which waits for the user to
 * hit enter before moving on.
 *
 * @param messageString {string}
 * @returns none
 */
export function displayMessage (messageString) {
  console.clear()
  console.log('Course Change Notifier\n')

  console.log(messageString)
  console.log()
  prompt('Press return to continue')
}

/**
 * Displays the title of the app in the console
 *
 * @param messageString {string}
 * @returns none
 */
export async function displayTitle () {
  console.clear()
  console.log('Course Change Notifier\n')
}

/**
 * Adds all courses that the authenticated user is currently enrolled in to
 * the list of tracked courses.
 *
 * @param studentID {string}
 * @returns none
 */
export async function addAllEnrolledCourses (studentID) {
  const enrolledCourses = await getAllCourses(studentID)
  let displayString = ''

  for (const course of enrolledCourses) {
    displayString += await addNewCourse(course.course_id, studentID)
    displayString += '\n'
  }

  displayString = displayString.substring(0, displayString.length - 1)

  displayMessage(displayString)
}

/**
 * Adds a given course to the database. If it already exists, it will simply
 * add the courseID to the students array of enrolled courses.
 *
 * @returns none
 */
export async function addNewCourse (courseID, studentID) {
  const classToAdd = await getClassByID(courseID)

  if (await doesClassExistInDB('\'' + courseID + '\'')) {
    const obj = await select(
            `SELECT * FROM USERS 
                        WHERE '${courseID}' = any (courses) 
                        AND BYUID = '${studentID}'`)

    if ((await obj).rowCount < 1) {
      insertCourseIntoStudentTable(courseID, studentID)
      insertStudentIntoCourseTable(studentID, courseID)

      return 'Course: ' + courseID + ' added successfully!'
    } else {
      return 'Course: ' + courseID + ' already registered'
    }
  } else {
    if (classToAdd !== undefined) {
      insertNewCourseIntoCourses(
        classToAdd.course_id,
        classToAdd.room_num,
        classToAdd.building,
        classToAdd.start_time,
        classToAdd.instructor_name,
        classToAdd.instructor_id,
        classToAdd.days_taught,
        [studentID])

      insertCourseIntoStudentTable(courseID, studentID)

      return 'Course: ' + courseID + ' added successfully!'
    } else {
      return 'Course not found in BYU catalog'
    }
  }
}

/**
 * Takes in list of courses pulled from the database and returns it as a
 * nice list of courses that can be displayed.
 *
 * @param courseList {object}
 * @returns {string}
 */
export function formatCourseListNicely (courseList) {
  const newString = courseList.rows[0].courses.reduce((acc, cur) => {
    let newStr = cur.split('/')

    newStr = '- ' + newStr[0] + ' ' + newStr[1] + ' Sec: ' + newStr[2]

    acc = acc + '\n' + newStr

    return acc
  }, '')
  return newString
}

/**
 * Initializes program. Gets the bearer token, and checks for connections to AWS, the database, and byu's API
 *
 * @param none
 * @returns {string} byuId of the user authenticated
 */
export async function initialize () {
  // Test AWS authentication
  try {
    await setDBParams()
  } catch (e) {
    displayMessage(e)
    return 0
  }

  // Test connection to your Docker Postgres server
  try {
    await connectDBClient()
  } catch (e) {
    displayMessage('Database instance not found; Make sure Docker is running with your postgres server')
    return 0
  }

  // Check if tables exist. Create them if they don't
  try {
    if (await select('SELECT * FROM users') === undefined) {
      throw ''
    }
  } catch (e) {
    displayMessage('Database table not found; Initializing tables now (this will only happen once)')
    await initializeTables()
  }

  while (studentID === undefined) {
    displayTitle()
    const token = (await iPrompt(tykTokenInput)).tykToken

    studentID = await setBearerToken(token)
  }
  return studentID
}

/**
 * Takes a section number from user input, then converts it to a 3 digit number (with leading 0's)
 *
 * @param inNum {string}
 * @returns {string} the number, with 0's added to the beginning to match BYU's api
 */
export function fixSectionNumberInput (inNum) {
  // A section number must be 3 digits long for BYU's course search API,
  // so I am checking if it is 3 digits long and prepending the given
  // number with 0's to return a number that the API will accept
  while (inNum.length < 3) {
    inNum = '0' + inNum
  }
  return inNum
}

/**
 * Gets an array of strings (course numbers) pulled from an api call
 *
 * @param array {object[]} This requires an array of course objects, which can be gotten with an api call
 * @returns {string[]} returns a string array of only the course numbers (for searching)
 */
export function getListOfCourseNumsFromArray (array) {
  const newArray = []
  array.forEach((item) => {
    newArray.push(item.catnum)
  })

  newArray.unshift('< Go back')
  return newArray
}

/**
 * This is a search function used by Inquirer to allow searching an array of strings.
 * It is not meant to be called explicitly. I got this code from the inquirer documentation
 *
 * @param answers {object}
 * @param input {string}
 * @returns {string[]} returns a string array of the searched values
 */
export function searchDepartments (answers, input = '') {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fuzzy.filter(input, listOfDepartments).map((el) => el.original))

      // I got this code from the documentation for the inquirer autocomplete plugin,
      // so I don't know what the magic numbers below do exactly.
      // It seems like it defines a random timeout for when you
      // are searching and no results are found?
    }, Math.random() * 470 + 30)
  })
}

/**
 * This is a search function used by Inquirer to allow searching an array of strings.
 * It is not meant to be called explicitly. I got this code from the inquirer documentation
 *
 * @param answers {object}
 * @param input {string}
 * @returns {string[]} returns a string array of the searched values
 */
export function searchCourseNums (answers, input = '') {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fuzzy.filter(input, listOfCourseNums).map((el) => el.original))

      // I got this code from the documentation for the inquirer autocomplete plugin,
      // so I don't know what the magic numbers below do exactly.
      // It seems like it defines a random timeout for when you
      // are searching and no results are found?
    }, Math.random() * 470 + 30)
  })
}

/**
 * An inquirer input validation function
 *
 * @param input {string}
 * @returns {boolean} returns 'true' if input is valid
 */
function validateSectionInput (input) {
  hasAlphaChar(input)

  if (parseInt(input) < 500 && input.length < 4 && parseInt(input) && !hasAlphaChar(input)) {
    return true
  } else {
    return 'Please enter a valid section number'
  }
}

/**
 * A helper function I found on StackOverflow to test for alphabetical character in string
 *
 * @param input {string}
 * @returns {boolean} returns 'true' if input contains alphabet char
 */
function hasAlphaChar (str) {
  let code, i, len

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i)
    if ((code > 64 && code < 91) || // upper alpha (A-Z)
        (code > 96 && code < 123)) { // lower alpha (a-z)
      return true
    }
  }
  return false
}

// Global Objects corresponding to different prompts I will use with inquirer
export const mainMenuPrompt = [
  {
    type: 'list',
    name: 'menuChoice',
    message: '',
    choices: ['- Fill with currently enrolled courses', '- Add a course by course number', '- Remove a course', '- Remove all courses', 'X Quit']
  }
]
export const departmentSearchPrompt = [
  {
    type: 'autocomplete',
    name: 'department',

    suggestOnly: false,

    message: 'Ensure that the course you select here is actually offered this semester!\nSearch for the course department: ',

    searchText: 'Searching...',
    emptyText: 'Nothing found!',
    source: searchDepartments,
    pageSize: 15
  }
]
export const courseNumSearchPrompt = [
  {
    type: 'autocomplete',
    name: 'courseNum',

    suggestOnly: false,

    message: 'Search for the course number: ',

    searchText: 'Searching...',
    emptyText: 'Nothing found!',
    source: searchCourseNums,
    pageSize: 15
  }
]
export const sectionNumPrompt = [
  {
    type: 'input',
    name: 'secNum',
    message: 'Enter the section number (ex: 1, 2, 018): ',
    validate: validateSectionInput
  }
]
export const confirmRemoveAll = [
  {
    type: 'list',
    name: 'confirmRemoveAll',
    message: 'Are you sure you want to remove all tracked classes?',
    choices: ['Yes, remove all courses', '< Go back']
  }
]
export const emailChoice = [
  {
    type: 'list',
    name: 'emailChoice',
    message: 'Which email would you like to be notified at?',
    choices: []
  }
]
export const emailInput = [
  {
    type: 'input',
    name: 'emailInput',
    message: 'Enter an email to receive course change notifications: '
  }
]
export const tykTokenInput = [
  {
    type: 'input',
    name: 'tykToken',
    message: 'Please enter a valid Tyk Bearer token: '
  }
]
