/**
 * @file: This file is the main one to be run. It contains the Command Line
 * interface for the app.
 *
 */

import {
  addToUsers,
  closeDBClient,
  getStudentsCourses,
  getUserFromDB,
  removeCourseFromUser,
  removeUserFromCourse,
  setDBParams
} from './database.js'
import {
  addAllEnrolledCourses,
  addNewCourse,
  confirmRemoveAll,
  courseNumSearchPrompt,
  departmentSearchPrompt,
  displayMessage,
  displayTitle,
  emailChoice,
  emailInput,
  fixSectionNumberInput,
  formatCourseListNicely,
  getListOfCourseNumsFromArray,
  initialize,
  mainMenuPrompt,
  sectionNumPrompt,
  setListOfCourseNums
} from './helpers.js'
import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import { getCourseListByDepartment, getEmails, getPersonsName } from './api_calls.js'

const iPrompt = inquirer.createPromptModule()
iPrompt.registerPrompt('autocomplete', inquirerPrompt)

main()

async function main () {
  displayMessage('This program allows users to track changes made to courses they are registered for, or any course in\n' +
                                'the BYU catalog! As long as the server is running, any classes added in this program will be tracked, and ' +
                                'an email will be sent to you informing you that the course was changed.')

  console.clear()
  const studentID = await initialize()

  // I do this to catch any error codes thrown from the initialize stage; IE uninitialized database
  if (studentID !== 0) {
    await userLogin(studentID)
  } else {
    return
  }

  await mainMenu(studentID)
}

/**
 * Prompts the user to input their BYU ID, then sets them up with an email to be
 * notified at if they are a new user.
 *
 * @param studentID {string}
 * @returns {string}
 */
async function userLogin (studentID) {
  const user = (await getUserFromDB(studentID))

  // If user is not found in DB
  if (user.rowCount === 0) {
    const emails = await getEmails(studentID)

    let email

    if (Object.keys(emails).length !== 0) {
      console.clear()
      console.log('Course Change Notifier\n')
      console.log('We found the following emails accociated with your BYUID:\n')

      const questions = emailChoice
      Object.keys(emails).forEach((key) => {
        questions[0].choices.push(emails[key])
      })
      questions[0].choices.push('Enter a new email')

      displayTitle()
      email = await iPrompt(questions)
      email = email.emailChoice
    }

    if (Object.keys(emails).length === 0 || !email.toString().includes('@')) {
      email = await iPrompt(emailInput)
      email = email.emailInput
    }

    await addToUsers(studentID, email, await getPersonsName(studentID))
  }
  return studentID
}

/**
 * Prompts the user to choose an option from the menu. Also displays all
 * currently tracked classes.
 *
 * @param studentID {string}
 * @returns none
 */
async function mainMenu (studentID) {
  let selection = ''

  while (selection.toLowerCase() !== 'q') {
    let mainMenuString = ''

    mainMenuString += `Welcome ${await (getPersonsName(studentID))}!\n\n`

    const niceCourseList = formatCourseListNicely(await getStudentsCourses(studentID))

    // If returned course list is empty
    if (niceCourseList === '') {
      mainMenuString += 'You are not currently tracking any courses. Add some below: '
    } else {
      mainMenuString += 'You are currently tracking the following courses:\n'
    }

    mainMenuString += formatCourseListNicely(await getStudentsCourses(studentID))
    mainMenuString += '\n\n'

    const mainMenu = mainMenuPrompt
    mainMenu[0].message = mainMenuString

    displayTitle()

    selection = await iPrompt(mainMenu)
    selection = selection.menuChoice

    switch (selection) {
      case '- Fill with currently enrolled courses':
        await addAllEnrolledCourses(studentID)
        console.clear()
        break

      case '- Add a course by course number':
        console.clear()
        console.log('Course Change Notifier\n')
        await addNewCoursePrompt(studentID)
        break

      case '- Remove a course':
        await removeCourse(studentID)
        break

      case '- Remove all courses':
        await removeAllCourses(studentID)
        break

      case 'X Quit':
        closeDBClient()
        return
        break

      default:
        console.log('Invalid selection')
        console.clear()
        break
    }
  }
}

/**
 * Prompts the user to add a new course with all the info needed to do so.
 *
 * @param studentID {string}
 * @returns none
 */
async function addNewCoursePrompt (studentID) {
  await setDBParams()

  let added = false

  while (added === false) {
    try {
      displayTitle()

      let department = ''

      department = await iPrompt(departmentSearchPrompt)
      department = department.department

      if (department === '< Go back') {
        return
      }

      const courseList = await getCourseListByDepartment(department)

      const localCourseList = getListOfCourseNumsFromArray(courseList)
      setListOfCourseNums(localCourseList)

      let courseNum = await iPrompt(courseNumSearchPrompt)
      courseNum = courseNum.courseNum

      if (courseNum === '< Go back') {
        return
      }

      let secNum = await iPrompt(sectionNumPrompt)
      secNum = secNum.secNum

      secNum = fixSectionNumberInput(secNum)

      const courseID = department + '/' + courseNum + '/' + secNum

      displayMessage(await addNewCourse(courseID, studentID))

      added = true
    } catch (e) {
      displayMessage('Course not found in BYU catalog')
    }
  }
}

/**
 * Prompts a user to select a course to remove from the list of tracked courses.
 *
 * @param studentID {string}
 * @returns none
 */
async function removeCourse (studentID) {
  const courses = await getStudentsCourses(studentID)
  const coursesFound = courses.rows[0].courses.length

  if (coursesFound === 0) {
    displayMessage('You are not currently tracking any courses')
    return
  }

  let courseToRemove = '-1'

  while ((parseInt(courseToRemove) > coursesFound + 1 || parseInt(courseToRemove) < 1) && courseToRemove !== 'q') {
    const messageString = 'Which course would you like to remove?'

    const choicesArray = formatCourseListNicely(courses).split('\n')
    choicesArray.push('< Go Back')

    choicesArray.splice(0, 1)

    const removeCoursePrompt = [
      {
        type: 'list',
        name: 'removeChoice',
        message: messageString,
        choices: choicesArray
      }
    ]

    displayTitle()
    let choice

    await iPrompt(removeCoursePrompt).then((answers) => {
      choice = answers.removeChoice
    }
    )
    courseToRemove = choicesArray.indexOf(choice) + 1

    if (courseToRemove === choicesArray.length) {
      return
    } else if (parseInt(courseToRemove) > coursesFound + 1 || parseInt(courseToRemove) < 1) {
      displayMessage('Invalid input. Please select a course from the list.')
      courseToRemove = '-1'
    }
  }

  const removedCourse = await removeCourseFromUser(studentID, parseInt(courseToRemove))
  await removeUserFromCourse(removedCourse, studentID)

  displayMessage(`Course ${removedCourse} successfully removed`)
}

/**
 * Removes all courses from a users tracking list
 *
 * @param studentID {string}
 * @returns none
 */
async function removeAllCourses (studentID) {
  displayTitle()
  let selection = await iPrompt(confirmRemoveAll)
  selection = selection.confirmRemoveAll

  if (selection === 'Yes, remove all courses') {
    while ((await getStudentsCourses(studentID)).rows[0].courses.length > 0) {
      const removedCourse = await removeCourseFromUser(studentID, 1)
      await removeUserFromCourse(removedCourse, studentID)
    }
    displayMessage('Successfully removed all courses')
  }
}
