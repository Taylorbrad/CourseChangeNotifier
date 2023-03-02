/**
 * @file: This file contains the server file that will run in the background,
 *          pull course data periodically, and send out an email to each student whose
 *          courses were modified
 */

import { getUserFromDB, select, setDBParams, update } from './database.js'
import { displayMessage, getAuthenticatedClient, initialize, sendEmail } from './helpers.js'
import { getClassByID } from './api_calls.js'

// Global auth object so my sendemail method can use it
let oAuth2Client

/**
 * Initialize the server, which will scan for course changes periodically based
 * on the amount of seconds that you pass to it
 *
 * @param seconds {int}
 * @return none
 */
export async function server (seconds) {
  displayMessage('This is the Course Change Notifier server. It will listen for changes \nmade to the ' +
        'database and email any students tracking the changed courses.')

  const studentID = await initialize()

  // If initialize returns an error code (0) end the program
  if (studentID === 0) {
    return
  }

  oAuth2Client = await getAuthenticatedClient()
  console.log('Authenticated with OAuth2\n\n')
  setInterval(function () { scanAndNotifyCourseChanges(oAuth2Client.credentials.refresh_token) }, seconds * 1000)
}

/**
 * This functions scans the database for changes to any data in each course row,
 * then sends an email to each student tracking a given changed course
 *
 * @param refreshTokenOAuth2 {object}
 * @return none
 */
export async function scanAndNotifyCourseChanges (refreshTokenOAuth2) {
  await setDBParams()

  const courseList = await select('SELECT * FROM COURSES')

  const usersToEmail = {}

  for (const cur of courseList.rows) {
    const newData = await getClassByID(cur.course_id)

    // Compare with current data in DB
    for (const curKey of Object.keys(newData)) {
      if (cur[curKey] !== newData[curKey]) {
        for (const studentID of cur.test) {
          const courseID = cur.course_id

          if (usersToEmail[studentID] === undefined) {
            usersToEmail[studentID] = new Set().add(courseID)
          } else {
            usersToEmail[studentID].add(courseID)
          }
        }

        console.log(cur.course_id + ': ' + curKey + ' ' + `'${cur[curKey]}' --> '` + newData[curKey] + '\'')

        update(`UPDATE COURSES SET ${curKey} = '${newData[curKey]}'
                        WHERE COURSE_ID = '${cur.course_id}'`)
      }
    }
  }

  for (const curKey of Object.keys(usersToEmail)) {
    const emailToSendTo = (await getUserFromDB(curKey)).rows[0].email

    let emailTextString = 'We have detected changes in the following courses: \n\n'

    for (const courseID of usersToEmail[curKey]) {
      let newStr = courseID.split('/')
      newStr = newStr[0] + ' ' + newStr[1] + '   Sec: ' + newStr[2]

      emailTextString += newStr + '\n'
    }

    emailTextString += "\n Review your schedule to make sure courses don't conflict!"

    await sendEmail(emailToSendTo, emailTextString, refreshTokenOAuth2)
  }
}
