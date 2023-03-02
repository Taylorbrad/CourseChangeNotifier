# Course Change Notifier


Here's the scenario: You are super on top of getting the perfect schedule; no conflicting start times, 
the classes are close together, etc. And you submitted your cart the first day it was available! You
got all the classes you wanted, and you're going to have the perfect semester. Fast-forward a few 
weeks, and the semester is about to start. You check your schedule over the weekend, and discover that
some of your classes were rescheduled, and they now conflict with each other. How could this happen?
Why didn't someone tell you about the changes made to the course you were registered for? How could
they do this to you?

This program allows users to track changes made to courses they are registered for, or any course in
the BYU catalog! While there is a server running, it will email each of the students tracking a course,
letting them know that the course details have been changed. (it tracks the room number, professor[s],
start time, building, and days taught for each course you track)

## Get Started

To get the program running, there are a few things we will need: 

[//]: # (1. AWS authentication)

[//]: # (2. Tyk Bearer token)

[//]: # (3. Postgres DB running in Docker)


### 1. AWS Authentication

Navigate to https://byulogin.awsapps.com/start#/ to get the AWS environment variables for the byu-org-trn account.

![alt text][logo]

[logo]: src/img/awsCreds.png "AWS Creds"

Click the box under "Option 1: ..." to copy the Credentials, then paste it into a command prompt before running the project.

![alt text][logo2]

[logo2]: src/img/awsPrompt.png "AWS Prompt"


### 2. Tyk Bearer token

You will need to generate a Bearer token from the training token generator at https://training-token-generator.byu.edu/#

### 3. Postgres DB Docker Instance

You should be running a postgres database in docker. You should run 'docker-compose up -d' if this
is the first time running the program.


## Running the Program

This program has two runnable files:

### 1. index.js, the interface where you log in and add the courses you want to track

First you will be prompted to enter a Bearer token:


![alt text][token]

[token]: src/img/tokenPrompt.png "Token Prompt"

![alt text][logged_in]

[logged_in]: src/img/loggedIn.png "logged in Prompt"

Now that you're logged in, it will prompt you with the main menu

![alt text][menu]

[menu]: src/img/mainMenu.png "Main menu"

This is what the course add option looks like: 

![alt text][add_course]

[add_course]: src/img/courseInput.png "Course add Prompt"

If the course is found, it will be added successfully to your list of tracked courses:

![alt text][added]

[added]: src/img/courseAdded.png "course added"

![alt text][newMenu]

[newMenu]: src/img/newMenu.png "Updated menu"

Now you are tracking some courses! Now you just need to run server.js (described below) to get
email notifications about any changes made to your course!

### 2. server.js, a file that will stay running and scan for changes periodically (every 12 seconds by default)

When you run the server, it will prompt you to input a Bearer token as well. Once you have done that, it will prompt
you to authenticate with the gmail account "coursechangenotifier@gmail.com", or you will have to enter it manually
in the browser page that opens. This is the email that will send the notifications out.

Once you've done that, it will tell you that it is authenticated with OAuth2. Then it will simply wait for changes to
occur. Anytime it detects a change, it will make a log entry like the one shown below (course: data_type 
'old_value' --> 'new_value'). It will then send an email to any students tracking the course to inform them the course
has been altered, and that they should review their schedule.

![alt text][server]

[server]: src/img/server.png "Updated menu"

Also, feel free to add or remove courses from your tracking list while the server is running, it will not affect
the servers' functionality. The newly added courses will be tracked without restarting the server.

### Example email:

![alt text][email]

[email]: src/img/email.png "email"
