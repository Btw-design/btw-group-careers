# Turning on the internship assignments (HR setup, about 5 minutes)

The two starter assignments (Digital Marketing Intern and Video Editor Intern) are built into the careers website.
They stay **switched off** until you connect them to a Google Sheet. After that, each submission is saved as a row
in the sheet and you get an email.

Until you finish these steps, the **Apply Now** buttons work exactly as before and candidates never see an assignment.

## Steps

1. **Create a Google Sheet** (any name, for example "Internship assignment submissions").
2. In the sheet, open **Extensions > Apps Script**.
3. Delete the sample code, then **paste the whole contents of `Code.gs`** (the file next to this one). Click **Save**.
4. Near the top of the code, check `HR_EMAIL` is the inbox that should get notifications.
5. Click **Deploy > New deployment**. Choose the type **Web app**, then set:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Click **Deploy** and allow the permissions Google asks for (it needs to edit the sheet and send email).
7. **Copy the Web app URL** (it ends with `/exec`).
8. In the website code, open `js/assignment-config.js` and paste the URL between the quotes:

   ```js
   window.BTW_ASSIGNMENT = {
       endpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec'
   };
   ```
9. Publish the change. Done.

## Check that it works

- Open the web app URL in a browser. You should see `{"ok":true,"service":"BTW assignment intake"}`.
- On the careers site, click **Apply Now** on the Digital Marketing Intern job. Do the assignment with a test name and email, and submit.
  You should see the "Your assignment has been submitted" message, a new row in the sheet, and an email.

## What candidates see

1. They click **Apply Now** on Digital Marketing Intern or Video Editor Intern.
2. A friendly window explains the assignment (about 20 to 30 minutes for Digital Marketing, 30 to 45 minutes for Video Editing)
   and offers **Start the assignment** or **Skip and go straight to the application**.
3. After they submit, a confirmation page says thank you and shows a **Continue to application** button that opens your existing HR portal.
4. People who already submitted or skipped go straight to the HR application next time (for 30 days).

Only the name, email and mobile number are required. Everything else is optional, so nobody is blocked or put off.

## Changing questions

The questions are plain HTML in `assignment/digital-marketing-intern/index.html` and `assignment/video-editor-intern/index.html`.
New questions appear automatically as new columns in the sheet.
