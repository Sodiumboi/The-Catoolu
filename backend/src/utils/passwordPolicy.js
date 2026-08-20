// Password policy — the single source of truth for every route that accepts a
// new password (register, reset-password, set-password, change-password).
//
// Keep the rule list in step with the checklist the settings modal renders
// (frontend/src/components/SettingsModal.jsx → PASSWORD_RULES). A rule shown in
// the UI but not enforced here is decorative: the reset-email flow and any
// direct API call would sail straight past it.

const MIN_LENGTH = 8;

const RULES = [
  {
    id: 'length',
    test: (pw) => pw.length >= MIN_LENGTH,
    error: `Password must be at least ${MIN_LENGTH} characters.`,
  },
  {
    id: 'number',
    test: (pw) => /[0-9]/.test(pw),
    error: 'Password must contain at least one number.',
  },
];

/**
 * @param   {string} password
 * @returns {string|null} the first failing rule's message, or null if valid
 */
function validatePassword(password) {
  if (typeof password !== 'string' || !password) {
    return 'Password is required.';
  }
  const failed = RULES.find((rule) => !rule.test(password));
  return failed ? failed.error : null;
}

module.exports = { validatePassword, MIN_LENGTH };
