/**
 * @file This file contains all the methods used to make changes to the local postgres database
 */

import pkg from 'pg'
import { displayMessage, getAWSParams } from './helpers.js'

const { Client } = pkg

// Global variable so each method has access to the credentials required to access the DB
let dbCreds
let dbClient

/**
 * Gets the login information for the local postgreSQL server from Parameter Store
 * and stores it in the global variable. Must be AWS authenticated to run this.
 *
 * @returns none
 */
export async function setDBParams () {
  if (dbCreds === undefined) {
    let credsFromPS
    try {
      credsFromPS = await getAWSParams(['DB_PWD', 'DB_USR'])
    } catch (e) {
      throw 'Not authenticated with AWS; please enter AWS credentials in the environment variables'
    }

    if (typeof credsFromPS.DB_USR !== 'string') {
      throw 'Failed to get credentials from AWS'
    }
    // Set global variable
    dbCreds = {
      host: 'localhost',
      user: credsFromPS.DB_USR,
      password: credsFromPS.DB_PWD,
      database: 'pgdb',
      port: 5432
    }
  }
}

/**
 * Checks if the client is initialized, then connects
 * the global client variable to the database
 *
 * @param none
 * @returns none
 */
export async function connectDBClient () {
  await setDBParams()
  if (dbClient === undefined) {
    try {
      dbClient = new Client(dbCreds)
      await dbClient.connect()
    } catch (e) {
      displayMessage('DB Connection Failure')
      throw 'DB connection failure'
    }
  } else {

  }
}

/**
 * Closes the client connection
 *
 * @param none
 * @returns none
 */
export async function closeDBClient () {
  dbClient.end()
}

/**
 * Adds the user as an enrolled student in the given course
 *
 * @param studentBYUID {string}
 * @param courseID {string}
 * @returns none
 */
export async function insertStudentIntoCourseTable (studentBYUID, courseID) {
  await connectDBClient()

  const course = await select(`SELECT * FROM COURSES
                                        WHERE COURSE_ID = '${courseID}'`)

  const queryText = `UPDATE COURSES SET TEST[${course.rows[0].test.length + 1}] = '${studentBYUID}'
                     WHERE COURSE_ID = '${courseID}'`

  await dbClient.query(queryText)
}

/**
 * Adds the course as a course taken by the user, given by the student ID
 *
 * @param studentBYUID {string}
 * @param courseID {string}
 * @returns none
 */
export async function insertCourseIntoStudentTable (courseID, studentBYUID) {
  await connectDBClient()

  const user = await select(`SELECT * FROM USERS
                                      WHERE BYUID = '${studentBYUID}'`)

  const queryText = `UPDATE USERS SET COURSES[${user.rows[0].courses.length + 1}] = '${courseID}'
                     WHERE BYUID = '${studentBYUID}'`

  await dbClient.query(queryText)
}

/**
 * Adds a new course to the database, and adds the student requesting to track
 * the course changes as a student enrolled in the course.
 *
 * @param courseID {string}
 * @param roomNum {string}
 * @param building {string}
 * @param startTime {string}
 * @param instructorName {string}
 * @param instructorID {string}
 * @param daysTaught {string}
 * @param test {array}
 * @returns none
 */
export async function insertNewCourseIntoCourses (courseID, roomNum, building, startTime, instructorName, instructorID, daysTaught, test) {
  const queryText = 'INSERT INTO COURSES (COURSE_ID, ROOM_NUM, BUILDING, START_TIME, INSTRUCTOR_NAME, INSTRUCTOR_ID, DAYS_TAUGHT, TEST) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'

  const values = [courseID, roomNum, building, startTime, instructorName, instructorID, daysTaught, test]

  insert(queryText, values)
}

/**
 * Adds the user to the users table with their email
 *
 * @param studentBYUID {string}
 * @param email {string}
 * @param name {string}
 * @returns none
 */
export async function addToUsers (studentBYUID, email, name) {
  const queryText = 'INSERT INTO USERS (BYUID, EMAIL, COURSES, NAME) VALUES ($1, $2, $3, $4)'
  const values = [studentBYUID, email, [], name]

  insert(queryText, values)
}

/**
 * Generic insert function to abstractify the insertion process
 *
 * @param queryText {string}
 * @param values {array}
 * @returns none
 */
export async function insert (queryText, values) {
  connectDBClient()
  await dbClient.query(queryText, values)
}

/**
 * Generic update function to update a row in the postgres database
 *
 * @param queryText {string}
 * @returns none
 */
export async function update (queryText) {
  connectDBClient()

  await dbClient.query(queryText)
}

/**
 * Generic select function to abstractify the selection process
 *
 * @param queryText {string}
 * @returns {object}
 */
export async function select (queryText) {
  connectDBClient()

  const dbData = await dbClient.query(queryText)

  return dbData
}

/**
 * Returns a courseList object containing all the courses stored in the users
 * row of the database
 *
 * @param studentID {string}
 * @returns {object}
 */
export async function getStudentsCourses (studentID) {
  const courselist = await select(`SELECT COURSES FROM USERS
                                            WHERE BYUID = '${studentID}'`)

  return courselist
}

/**
 * Returns an object containing all the data from the given users row in the DB
 *
 * @param studentBYUID
 * @returns {object}
 */
export async function getUserFromDB (studentBYUID) {
  const queryText = `SELECT * FROM USERS 
                     WHERE BYUID = '${studentBYUID}'`
  return select(queryText)
}

/**
 * Returns a boolean indicating whether or not the given courseID exists in the Database
 *
 * @param courseID {string}
 * @returns {boolean}
 */
export async function doesClassExistInDB (courseID) {
  const queryText = `SELECT * FROM COURSES
                     WHERE COURSE_ID = ${courseID}`

  const rows = await select(queryText)

  if (await rows.rows.length === 0) {
    return false
  } else {
    return true
  }
}

/**
 * Removes a course (based on index of tracked classes) from a student users tracked courses,
 * then returns the ID of the removed course for future use
 *
 * @param studentBYUID {string}
 * @param courseIndex {int}
 * @returns {string}
 */
export async function removeCourseFromUser (studentBYUID, courseIndex) {
  connectDBClient()

  const courses = await select(`SELECT COURSES FROM USERS
                                         WHERE BYUID = '${studentBYUID}'`)

  const courseID = courses.rows[0].courses[courseIndex - 1]

  const queryText = `UPDATE USERS SET courses = array_remove (courses, '${courseID}')
                    WHERE BYUID = '${studentBYUID}'`

  await dbClient.query(queryText)

  return courseID
}

/**
 * Removes a userID from the courses row in the DB to indicate the student is no longer enrolled.
 *
 * @param courseID {string}
 * @param studentBYUID {string}
 * @returns none
 */
export async function removeUserFromCourse (courseID, studentBYUID) {
  connectDBClient()

  const queryText = `UPDATE COURSES SET test = array_remove (test, '${studentBYUID}')
                     WHERE COURSE_ID = '${courseID}'`

  await dbClient.query(queryText)
}

/**
 * Initializes the 'users' and 'courses' tables in the Docker postgres database
 *
 * @param none
 * @returns none
 */
export async function initializeTables () {
  connectDBClient()

  const queryText = `
                CREATE TABLE "public"."courses" (
                    "course_id" text NOT NULL,
                    "room_num" text NOT NULL,
                    "building" text NOT NULL,
                    "start_time" text NOT NULL,
                    "instructor_name" text NOT NULL,
                    "instructor_id" text NOT NULL,
                    "days_taught" text NOT NULL,
                    "test" character varying[] NOT NULL) WITH (oids = false);
        
        
        CREATE TABLE "public"."users" (
            "byuid" text NOT NULL,
            "email" text NOT NULL,
            "courses" character varying[] NOT NULL,
            "name" text NOT NULL,
            CONSTRAINT "Users_byuid" PRIMARY KEY ("byuid")) WITH (oids = false);`

  const dbData = await dbClient.query(queryText)
  return dbData
}
