/**
 * @file: This file contains all methods responsible for calling the byu apis
 */

import axios from 'axios'
import { displayMessage } from './helpers.js'

export const axiosOptions = {
  url: '',
  method: 'GET'
}

/**
 * function to get a json object with all the class details for a students courses from the current semester
 *
 * @param classID {string}
 * @returns {object}
 */
export async function getAllCourses (studentID) {
  try {
    axiosOptions.url = `https://api-sandbox.byu.edu:443/domains/legacy/academic/registration/enrolled_classes/v1/byuid/${studentID}`

    const response = await axios(axiosOptions)

    const classObjectList = response.data.EnrolledClassesService.response.class_list.reduce(async (acc, cur) => {
      acc = await acc // needed this line because of weird reduce stuff that occurs when using async / await and array.push()

      let curCourseID = cur.teaching_area + '/' + cur.course_number
      curCourseID += (cur.course_suffix === null ? '' : cur.course_suffix)
      curCourseID += '/' + cur.section_number

      acc.push(await getClassByID(curCourseID))

      return acc
    }, Promise.resolve([])) // This was to fix weird async / await stuff too

    return classObjectList
  } catch (e) {
    console.log(e)
  }
}

// PersonsAPI below

/**
 * Sets the bearer token for future api calls, and verifies and returns a BYU ID
 *
 * @param token {string}
 * @returns {string}
 */
export async function setBearerToken (token) {
  try {
    axiosOptions.headers = { Authorization: 'Bearer ' + token }

    axiosOptions.url = 'https://api-sandbox.byu.edu/openid-userinfo/v1/userinfo?schema=openid'

    const response = await axios(axiosOptions)

    console.clear()

    const data = await response.data

    if (data['http://byu.edu/claims/client_byu_id']) { return data['http://byu.edu/claims/client_byu_id'] }
  } catch (e) {
    displayMessage('Invalid token input')
  }
}

/**
 * Gets any publicly available email addresses of the person associated with the given student ID number passed in
 *
 * @param studentBYUID {string}
 * @returns {object}
 */
export async function getEmails (studentBYUID) {
  try {
    axiosOptions.url = `https://api-sandbox.byu.edu:443/byuapi/persons/v3/${studentBYUID}/email_addresses`

    const response = await axios(axiosOptions)

    const email_addresses_json = response.data

    let i = 1
    const emails = email_addresses_json.values.reduce((acc, cur) => {
      if (cur.email_address !== undefined) {
        acc[i.toString()] = cur.email_address.value
        ++i
      }
      return acc
    }, {})

    return emails
  } catch (e) {
    return {}
  }
}

/**
 * Gets the preferred first name of the person associated with the given BYUID
 *
 * @param studentBYUID {string}
 * @returns {string}
 */
export async function getPersonsName (studentBYUID) {
  try {
    axiosOptions.url = `https://api-sandbox.byu.edu:443/byuapi/persons/v3/${studentBYUID}`

    const response = await axios(axiosOptions)

    const person_json = response.data

    return person_json.basic.preferred_first_name.value
  } catch (e) {
    return undefined
  }
}

// Get Class API below

/**
 * function to get a json object with all the class details
 *
 * @param classID {string}
 * @returns {object}
 */
export async function getClassByID (classID) {
  axiosOptions.url = `https://api-sandbox.byu.edu:443/domains/legacy/academic/classschedule/coursesection/v2/20231/${classID}`

  const response = await axios(axiosOptions)

  if (response.status === 200) {
    const instructorData = response.data.CourseSectionService.response.course_section_instructor_set
    const classData = response.data.CourseSectionService.response.course_section_schedule_set

    return getClassObject(instructorData, classData, classID)
  } else {
    return undefined
  }
}

/**
 * Helper function to simplify the logic of getClassByID(...)
 *
 * @param instructorData {object}
 * @param classData {object}
 * @param classID {string}
 * @returns {object}
 */
async function getClassObject (instructorData, classData, classID) {
  instructorData = instructorData.reduce((acc, cur) => {
    if (acc.instructorName === undefined) {
      acc.instructorName = cur.sort_name + '/'
      acc.instructorID = cur.net_id + '/'
    } else {
      acc.instructorName = acc.instructorName + cur.sort_name + '/'
      acc.instructorID = acc.instructorID + cur.net_id + '/'
    }
    return acc
  }, {})
  classData = classData.reduce((acc, cur) => {
    if (acc.roomNum === undefined) {
      acc.roomNum = cur.room + '/'
      acc.building = cur.building + '/'
      acc.startTime = cur.begin_time + '/'
      acc.daysTaught = cur.days_taught + '/'
    } else {
      acc.roomNum = acc.roomNum + cur.room + '/'
      acc.building = acc.building + cur.building + '/'
      acc.startTime = acc.startTime + cur.begin_time + '/'
      acc.daysTaught = acc.daysTaught + cur.days_taught + '/'
    }
    return acc
  }, {})

  return {
    course_id: `${classID}`,
    room_num: `${classData.roomNum}`,
    building: `${classData.building}`,
    start_time: `${classData.startTime}`,
    instructor_name: `${instructorData.instructorName}`,
    instructor_id: `${instructorData.instructorID}`,
    days_taught: `${classData.daysTaught}`
  }
}

// Get Courses in Department API below
/**
 * function to get a json object with all of the offered courses from a given department
 *
 * @param department {string}
 * @returns {object}
 */
export async function getCourseListByDepartment (department) {
  axiosOptions.url = `https://api-sandbox.byu.edu:443/domains/legacy/academic/advisement/departmentlistpage/v1/${department}`

  const response = await axios(axiosOptions)

  if (response.status === 200) {
    return response.data.DeptListPageService.response.classInfo
  } else {
    return undefined
  }
}
