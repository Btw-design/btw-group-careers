# Internship assignments: Google Sheet setup (about 10 minutes)

This connects the two assignments (Digital Marketing Intern, Video Editor Intern) to a Google Sheet.

**What you get:** every submission is saved as a new row, **Digital Marketing and Video Editor in separate tabs**, and HR gets an **email for every new submission**.

You do not need to know how to code. Just copy, paste and click.

> Until you finish this and the website is updated (Step 9), nothing changes for candidates. The **Apply Now** buttons work exactly as before.

---

## Part A: Create the sheet and the script

### Step 1. Create the Google Sheet
1. Go to https://sheets.google.com and click **Blank spreadsheet**.
2. Name it **Internship assignment submissions** (click "Untitled spreadsheet" at the top left).
3. Use a Google account that HR controls (ideally the shared HR account). This account will own the sheet and send the notification emails.

### Step 2. Open the script editor
1. In the sheet, click **Extensions > Apps Script**. A new tab opens.

### Step 3. Paste the code
1. In the editor you will see a file called `Code.gs` with a few lines of sample code. **Select everything and delete it.**
2. Open the file `Code.gs` from this folder (`docs/assignment-setup/Code.gs`), **copy all of it**, and **paste it** into the editor.
3. Click the **Save** icon (disk).

### Step 4. Set the HR email address
1. Near the top of the code, find this line:
   `var HR_EMAIL = 'hr@btwvisas.com';`
2. Change the address to the inbox that should get a notification for every submission. For more than one person, separate with commas: `'hr@btwvisas.com, hiring@btwvisas.com'`
3. Click **Save**.

### Step 5. Run the built-in self-test (this also gives permission)
1. At the top, next to the **Run** button, choose the function **`testSetup`** from the drop-down.
2. Click **Run**.
3. Google asks for permission. Click **Review permissions**, choose your account, then:
   - If you see **"Google hasn't verified this app"**, click **Advanced**, then **Go to (project name) (unsafe)**. This is normal for your own script.
   - Click **Allow**. (It needs to edit this sheet and send email.)
4. Run `testSetup` again if it asked you to authorise first.

**What you should see:** in the log at the bottom: `Result: {"ok":true} | Row saved in the "Digital Marketing Intern" tab: YES | HR email: sent`

### Step 6. Check the self-test worked
- In the Google Sheet, there is now a tab called **Digital Marketing Intern** with a row named **TEST - please ignore**.
- The HR inbox received an email: *"Assignment: Digital Marketing Intern - TEST - please ignore"*. (Check spam if you do not see it.)

If both are true, the sheet and the email part work. You can delete the test row.

---

## Part B: Publish it and test it for real

### Step 7. Deploy as a web app
1. In the script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** Assignment intake
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
     (This only lets the website *send* answers in. Nobody can read your sheet through it. The sheet stays private.)
4. Click **Deploy**, then **copy the Web app URL**. It ends with `/exec`.

### Step 8. Test the live web app
1. Paste the URL into a new browser tab. You should see exactly: `{"ok":true,"service":"BTW assignment intake"}`
2. Now open the file **`test-submit.html`** (in this same folder) by double-clicking it on your computer.
3. Paste your Web app URL into the box and click **Send test submissions**.
4. You should see two green results (one for each role). Then check:
   - The sheet now has **two tabs**: **Digital Marketing Intern** and **Video Editor Intern**, each with a new TEST row.
   - HR received **two emails**.
   - In the Digital Marketing tab, the test name `=1+1` is shown **exactly as `=1+1`**, not as the number 2. (This proves no formula can run.)
5. Send the URL to the developer (or continue to Step 9). Delete the TEST rows when you are done.

### Step 9. Switch the assignments on
1. In the website code, open `js/assignment-config.js`.
2. Paste your URL between the quotes:
   ```js
   window.BTW_ASSIGNMENT = {
       endpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec'
   };
   ```
3. Publish the website change (merge the pull request). After a minute or two the assignment step is live.

### Step 10. One last check on the live site
1. On the careers site, click **Apply Now** on Digital Marketing Intern. Choose **Start the assignment**, type your name, email and phone, and submit.
2. You should see **"Thank you ... Your assignment has been submitted"** and a **Continue to application** button.
3. A new row appears in the sheet and an email arrives. Delete the test row.
4. Click **Apply Now** again, then **Skip and go straight to the application**. You should land on the normal HR application.

---

## If something does not work

| What you see | What to do |
|---|---|
| Opening the web app URL asks you to sign in | In Step 7, **Who has access** must be **Anyone**. Redeploy: **Deploy > Manage deployments > pencil icon > Version: New version > Deploy**. |
| The website says "we could not send your answers" | The URL in `assignment-config.js` is wrong or the deployment is restricted. Re-do Step 7 and Step 8. |
| Row saved but **HR email** column says `FAILED` | Google limits emails per day (about 100 for a free Gmail account, 1,500 for Google Workspace). The answers are still saved. Check the sheet. |
| You changed the code later | **Deploy > Manage deployments > pencil icon > Version: New version > Deploy.** The URL stays the same. |
| A candidate says they submitted twice | Fine. A resend is recognised and saved only once. |

## Is it secure?

- The web app **only accepts submissions**. It never sends sheet data back to anyone.
- The sheet is private. Share it only with people in HR.
- Only the two assignment roles are accepted, and each goes to its own tab.
- There are size limits, a hidden spam trap, and candidate text is saved as plain text so it can never run as a formula.
- The HR email address is set in the script. The website cannot change it.
- The web app address is visible in the website's code (that is how every website form works). That is why the script checks and limits everything it receives.
- Candidate details (name, email, phone, answers) are personal data. Limit access to the sheet and delete old rows according to your HR policy.

## Changing the questions later
The questions are plain HTML in `assignment/digital-marketing-intern/index.html` and `assignment/video-editor-intern/index.html`.
A new question automatically becomes a new column in the sheet.
