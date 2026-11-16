/* ==========================================================================
   Assignment settings — the ONE place HR edits.

   endpoint: the web-app URL of the assignment intake script (Google Apps Script).
             Setup guide: docs/assignment-setup/README.md
             Looks like: https://script.google.com/macros/s/AKfycb.../exec

   If `endpoint` is empty, the assignment step is switched OFF: the Apply
   buttons go straight to the HR application exactly as before, and nothing
   is shown to candidates about assignments.
   ========================================================================== */
window.BTW_ASSIGNMENT = {
    endpoint: 'https://script.google.com/macros/s/AKfycbzKnKZysjs8f1rycilxA_UHW3tdloKZ5ilbFM3m_jpUnczT5-aEJO0RZcRSosLJxvE/exec'
};
