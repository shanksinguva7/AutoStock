export type Role = 'user' | 'admin';

/** The public user shape the backend returns (never includes the password hash). */
export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

const STORAGE_KEY = 'autostock.session';

// Trade-off: localStorage keeps users signed in across reloads but is readable by any script on
// the page (XSS); memory-only storage is safer but logs everyone out on refresh. We accept
// localStorage because the JWT is short-lived and the app renders no untrusted HTML.

/** Returns the stored session, or null when there is none or it is unreadable. */
export function loadSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    return parsed.token && parsed.user ? (parsed as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
