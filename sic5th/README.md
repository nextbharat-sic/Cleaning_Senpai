<!-- "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" -->
# CleaningSENPAI
 
App focused on waste management in IITH
 
Take a picture of the waste problem and inform the cleaning crew.

Enjoy beautiful campus life!

## File tree
<pre>
react-amplify-app
├── amplify
├── build
├── lambda
├── lambda_PR
├── node_modules
├── public
├── src
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── amplifyconfiguration.json
    ├── aws-exports.js
    ├── components
    │   ├── Home.js
    │   ├── supervisor
    │   │   ├── ComplaintsList.css
    │   │   ├── ComplaintsList.js
    │   │   ├── Home.js
    │   │   ├── MapFeatures.css
    │   │   ├── MapFeatures.js
    │   │   ├── NavigationBar.css
    │   │   ├── NavigationBar.js
    │   │   ├── Notification.css
    │   │   ├── Notification.js
    │   │   ├── Profile.css
    │   │   └── Profile.js
    │   └── user
    │       ├── Completed.css
    │       ├── Completed.js
    │       ├── History.css
    │       ├── History.js
    │       ├── Home.js
    │       ├── MapFeatures.css
    │       ├── MapFeatures.js
    │       ├── NavigationBar.css
    │       ├── NavigationBar.js
    │       ├── Notification.css
    │       ├── Notification.js
    │       ├── Onboarding.css
    │       ├── Onboarding.js
    │       ├── Profile.css
    │       ├── Profile.js
    │       ├── WebcamCapture.css
    │       └── WebcamCapture.js
    ├── data
    │   ├── Academicblock_backup.json
    │   ├── IITHCampusGeofence.json
    │   ├── IITHGeofence.json
    │   └── landmarks.json
    ├── index.css
    ├── index.js
    ├── logo.svg
    └── setupTests.js
</pre>
 
# DEMO
 ![WhatsApp_Image_2025-01-24_at_15.39.41](/uploads/3e36aa2c51565b6d2cf6ea3ed169d32d/WhatsApp_Image_2025-01-24_at_15.39.41.jpeg)
 ![WhatsApp_Image_2025-01-24_at_15.39.40__1_](/uploads/37a2177b40067ba62d43b7ae128380fb/WhatsApp_Image_2025-01-24_at_15.39.40__1_.jpeg)
 ![WhatsApp_Image_2025-01-24_at_15.39.40](/uploads/56bb80cd01cca992bb324742a204edef/WhatsApp_Image_2025-01-24_at_15.39.40.jpeg)

 
# Features
 
・Notification function to determine if trash has been cleaned

・Create a Report by simply taking a photo at the location in waste problem

・Comlpaints are easy to read and Cleaned reporting is simple
 
# Requirement
 <pre>
 react-amplify-app:Node.js==v18.20.5
    ├── @aws-amplify/auth@6.8.3
    ├── @aws-amplify/ui-react@6.7.1
    ├── @emotion/react@11.14.0
    ├── @fortawesome/fontawesome-svg-core@6.7.2
    ├── @fortawesome/free-solid-svg-icons@6.7.2
    ├── @fortawesome/react-fontawesome@0.2.2
    ├── aws-amplify@6.10.3
    ├── axios@1.7.9
    ├── cra-template@1.2.0
    ├── maplibre-gl@4.7.1
    ├── react-dom@18.3.1
    ├── react-router-dom@7.0.2
    ├── react-scripts@5.0.1
    ├── react-spinners@0.15.0
    ├── react-webcam@7.2.0
    └── react@18.3.1
 </pre>
# Installation
 
Execute the following command in the hierarchy where package.json is located.
 
```bash
$ sudo yum install nodejs npm
$ npm i

$ node -v
v18.20.5
```
 
# Usage
 Set up the Amplify environment.

 1. Create AWS account

 2. Add AWS Amplify related permissions to rules

 3. Get and download the accessID and key

 4. Push the necessary services (Cognito, CloudFront, etc.)

 5. Publish and check with Cloudfront

## Environment ST or PR

### Create an Amplify for the ST environment

```bash
$ sudo amplify configure || sudo amplify env add
Note: It is recommended to run this command from the root of your app directory
? Enter a name for the environment ST

Using default provider  awscloudformation
? Select the authentication method you want to use: AWS access keys
? accessKeyId:  [hidden] 
almost Enter

$ amplify init

$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
$ ~/.nvm/nvm.sh
$ nvm install --lts

$ npm i
$ npm run build
$ npm run start

```
To check with Cloudfront through AWS services, use the following command
 
```bash
$ sudo amplify init

$ sudo amplify push

$ sudo amplify publish
```

Environment is changed with the following command.

```bash
$ sudo amplify env checkout dev # dev is environment name
```

### Create an Amplify for the PR environment

Change the AWS environment from ST to PR.

Follow the same procedure as when setting up the ST environment.

```bash
$ sudo amplify env add
Note: It is recommended to run this command from the root of your app directory
? Enter a name for the environment PR

Using default provider  awscloudformation
? Select the authentication method you want to use: AWS access keys
? accessKeyId:  [hidden] 
almost Enter

$ sudo amplify init

$ sudo amplify push

$ sudo amplify publish
```
 
# Release Note

## Version 1.0.0
Release Date: January 23, 2025

Summary: Initial release of the application.

Features:
* User authentication and login system
* Dashboard access for users
* Basic functionality for student and supervisor roles
* Initial UI/UX design implementation

### Version 1.1.0
Release Date: January 29, 2025

Summary: Enhancement of the login system.

Changes:
* Optimized login logic for better security and efficiency
* Improved session management to prevent unauthorized access

### Version 1.1.1
Release Date: January 29, 2025

Summary: Bug fix for login system.

Changes:
* Resolved login failure issue affecting certain users
* Fixed session timeout bug for smoother user experience

### Version 1.2.0
Release Date: February 3, 2025

Summary: Bug fix for supervisor feature.

Feature changes:
* Bug in supervisor region data
* Modified part of the logic for the sorting complaints feature
* Enlarged photos close when tapping outside the photo


UI changes:
* Added a loading screen after changing the status
* Screen reload after changing the status
* Changed the notification message

## Version 2.0.0
Release Date: February 18, 2025

Summary: Update feature for supervisor

New features:
* Report deny feature (Supervisor)
* Feature to escalate from supervisor to admin (Supervisor)
* Supervisor can choose the role after login (Supervisor)
* Feature to forward reports to CMD(supervisor)
* Opening screen(normal user)
* Delete all notification feature
* Sharing Feature(supervisor)

## Version 2.1.0
Release Date: March 27, 2025

Summary: Fix UI and supervisor location information required

Feature changes:
* Not require location permission after login (Supervisor)
* Fixed misalignment of Onbording buttons (normal user)

# Author
 
* SIC Agile 5th member

# License

This repository is licensed under the MIT License. Please refer to License.txt for more details.
