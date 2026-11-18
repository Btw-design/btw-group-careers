# BTW Group Internship Assignment Portal: HR guide

The Assignment Portal lives at **`/assignment-portal/`** on the careers website.
Candidates choose **Digital Marketing Intern** or **Video Editor Intern**, register (name, email, mobile), answer
multiple-choice and practical questions, submit, and then continue to the existing HR application.
They can skip the assignment at any time. Progress is saved on their device, so they can come back and continue.

**For HR, everything lands in one Google Sheet:**
- **One tab per role** (Digital Marketing Intern, Video Editor Intern) plus a **Dashboard** tab.
- The multiple-choice questions are **marked automatically** ("MCQ score", for example 7/8).
- A **Review status** dropdown (New, Reviewed, Shortlisted, Not shortlisted) and an **HR notes** column.
- An **email to HR for every new submission**.

You do not need to know how to code. Copy, paste and click.

> The existing HR application (hr.btwgroup.co) is not changed in any way.

---

## A. You already did the first setup? Update the script (5 minutes)

Do this once so the sheet gets the Dashboard, scoring and the review dropdown. **Your web link stays the same.**

1. Open your Google Sheet **Internship assignment submissions**.
2. **Tidy first (recommended):** right-click the old tabs **Digital Marketing Intern** and **Video Editor Intern** and choose **Delete**.
   They only contain test rows from the first setup, and fresh tabs give you neat columns.
3. Click **Extensions > Apps Script**.
4. Select all the code in `Code.gs` and **delete it**. Open `docs/assignment-setup/Code.gs` from this project, **copy all of it** and **paste it in**. Click **Save**.
5. Check `HR_EMAIL` near the top is the inbox that should get notifications (several: separate with commas). Save.
6. Choose the function **`setupSheets`** in the drop-down next to **Run** and click **Run**.
   If Google asks for permission again, approve it yourself (**Review permissions > your account > Advanced > Go to ... (unsafe) > Allow**).
7. Check the sheet now has **three tabs: Dashboard, Digital Marketing Intern, Video Editor Intern**.
8. Click **Deploy > Manage deployments**, click the **pencil icon**, set **Version** to **New version**, and click **Deploy**.
   (**Execute as: Me**, **Who has access: Anyone**. The URL does not change.)
9. Go to Part D (test).

## B. First-time setup (10 minutes)

1. Go to https://sheets.google.com, click **Blank spreadsheet**, name it **Internship assignment submissions**. Use a Google account HR controls: it owns the sheet and sends the emails.
2. Click **Extensions > Apps Script**. Delete the sample code, paste all of `docs/assignment-setup/Code.gs`, click **Save**.
3. Set `HR_EMAIL` near the top. Save.
4. Choose **`setupSheets`** next to **Run** and click **Run**. Approve Google's screens yourself (**Review permissions > your account > Advanced > Go to ... (unsafe) > Allow**). The warning is normal for your own script.
5. Choose **`testSetup`** and click **Run**. You should see `Row saved ... YES ... HR email: sent` in the log. The sheet gets a "TEST - please ignore" row and HR gets an email.
6. Click **Deploy > New deployment > Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy** and **copy the Web app URL** (ends with `/exec`).
   "Anyone" only lets the website *send* answers in. Nobody can read your sheet through it.
7. In `js/assignment-config.js` paste the URL between the quotes, then publish the website change:
   ```js
   window.BTW_ASSIGNMENT = {
       endpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec'
   };
   ```

## C. Using the sheet (every day)

| Where | What you do |
|---|---|
| **Dashboard** tab | See how many submissions each role has and how many are New / Reviewed / Shortlisted / Not shortlisted. It updates by itself. |
| **Digital Marketing Intern** and **Video Editor Intern** tabs | One row per candidate, newest at the bottom. Columns: name, email, phone, candidate type, **MCQ score**, **time taken**, **Review status**, **HR notes**, then every answer. |
| **Review status** | Click the cell and choose New, Reviewed, Shortlisted or Not shortlisted. The row colours change automatically. |
| **MCQ score** | Marked automatically. It is only a quick guide: please also read the written answers and the practical task (for Video Editor, open the video link). |
| **Email** | HR gets an email for every submission. Press **Reply** to write straight to the candidate. |
| **HR email** column | Says `sent`. If it says `FAILED`, Google's daily email limit was reached (about 100 for a free Gmail account, 1,500 for Google Workspace). The answers are still saved in the sheet. |
| **BTW Assignments** menu (top of the sheet) | Set up / repair this sheet, refresh the Dashboard, send a test submission. |

## D. Test it for real

1. Open the web app URL in a browser. You should see exactly: `{"ok":true,"service":"BTW assignment intake"}`
2. Double-click **`test-submit.html`** (this folder) on your computer, paste your Web app URL and click **Send test submissions**.
3. You should see **four green results**. Then check:
   - The sheet has **Dashboard**, **Digital Marketing Intern** (1 TEST row, **MCQ score 2/8**) and **Video Editor Intern** (2 TEST rows, one scores **1/7**).
   - **Review status** shows **New** (with a dropdown) on every row.
   - HR received **three emails** (not four). The duplicate must not send a second email.
   - The reply to the 2nd duplicate send said `"duplicate":true`.
   - The test name `=1+1` is shown **exactly as `=1+1`**, not as the number 2.
4. Delete the TEST rows when done.
5. On the live careers site: click **Apply Now** on Digital Marketing Intern, then **Start the assignment**, register, answer a few questions and submit.
   You should see "Your assignment has been submitted", a row in the sheet and an email. Then click **Apply Now** again and check **Skip** goes to the normal HR application.

## If something does not work

| What you see | What to do |
|---|---|
| Opening the web app URL asks you to sign in | **Who has access** must be **Anyone**. Redeploy: **Deploy > Manage deployments > pencil icon > Version: New version > Deploy**. |
| The website says "we could not send your answers" | The URL in `assignment-config.js` is wrong, or the deployment is restricted. Redo Part B step 6 and Part D. |
| The sheet has no Dashboard or dropdown | Run **`setupSheets`** again (or use the **BTW Assignments** menu). |
| You changed the script later | **Deploy > Manage deployments > pencil icon > Version: New version > Deploy.** The URL stays the same. |
| A candidate says they submitted twice | Fine. A resend is recognised and saved only once. |
| A candidate lost their progress | Progress is saved on the device and browser they used. It is gone if they cleared their browser data or switched device. They can simply start again. |

## Is it secure?

- The web app **only accepts submissions**. It never sends sheet data back to anyone.
- The multiple-choice **answer key lives only in the Google script**, not on the website, so candidates cannot read it.
- The sheet is private. Share it only with people in HR.
- Only the two roles are accepted, each into its own tab. There are size limits, a hidden spam trap, and candidate text is saved as plain text so it can never run as a formula.
- The HR email address is set in the script. The website cannot change it.
- The web app address is visible in the website's code (as with every website form). That is why the script checks and limits everything it receives.
- Candidate details (name, email, mobile, answers) are personal data. Limit who can open the sheet and delete old rows according to your HR policy.

## Changing questions later

- **Questions and options:** `js/portal-data.js`. A new question automatically becomes a new column in the sheet.
- **Multiple-choice answers (the key):** `ROLE_CONFIG` at the top of `Code.gs`. If you change the wording of a multiple-choice option, change the same words in the key, or it will be marked wrong. Paste the new script and redeploy (Part A, steps 4 and 8).
