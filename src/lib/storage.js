// Tiny localStorage helpers for the two things we persist:
//   - that the shared password was entered
//   - which of the two users this device is
const AUTH_KEY = 'pk_auth';
const USER_KEY = 'pk_user';

export function isAuthed() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAuthed() {
  try {
    localStorage.setItem(AUTH_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

export function getUser() {
  try {
    return localStorage.getItem(USER_KEY) || null;
  } catch {
    return null;
  }
}

export function setUser(name) {
  try {
    localStorage.setItem(USER_KEY, name);
  } catch {
    /* ignore */
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}
