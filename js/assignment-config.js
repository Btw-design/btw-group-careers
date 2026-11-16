/* ==========================================================================
   Assignment settings — the ONE place HR edits.

   endpoint: the web-app URL of the assignment intake script (Google Apps Script).
             Setup takes about 5 minutes: see docs/assignment-setup/README.md
             Looks like: https://script.google.com/macros/s/AKfycb.../exec

   While `endpoint` is empty, the assignment step is switched OFF: the Apply
   buttons go straight to the HR application exactly as before, and nothing
   is shown to candidates about assignments.
   ========================================================================== */
window.BTW_ASSIGNMENT = {
    endpoint: ''
};
