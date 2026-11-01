// Supabase Auth only accepts an email or phone number as a password login
// identifier, so each login ID maps to an internal email that is never shown.
const INTERNAL_EMAIL_DOMAIN = "users.content-calendar.app";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username);
}

export function toAuthEmail(username: string) {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}
