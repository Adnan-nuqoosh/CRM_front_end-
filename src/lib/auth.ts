// ════════════════════════════════════════════════════════════════════════════
// AUTH HELPERS
// Stores the auth token, the logged-in user, and the active company id in
// browser storage. "Remember me" decides localStorage (persists across
// browser restarts) vs sessionStorage (cleared when the tab closes).
// ════════════════════════════════════════════════════════════════════════════

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

const TOKEN_KEY = "nuqoosh.token";
const USER_KEY = "nuqoosh.user";
const ACTIVE_COMPANY_KEY = "nuqoosh.active_company_id";

/**
 * Saves the token + user after a successful login.
 * Writes to localStorage if "remember" is checked, otherwise sessionStorage.
 * Always clears both storages first so a previous session can't linger.
 */
export function saveAuth(args: {
  token: string;
  user: AuthUser;
  remember: boolean;
}) {
  if (typeof window === "undefined") return;

  const storage = args.remember
    ? window.localStorage
    : window.sessionStorage;

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);

  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);

  storage.setItem(TOKEN_KEY, args.token);
  storage.setItem(USER_KEY, JSON.stringify(args.user));
}

/** Clears all auth + active-company data from both storages (used on logout). */
export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ACTIVE_COMPANY_KEY);

  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
}

/** Returns the stored auth token, checking localStorage then sessionStorage. */
export function getToken(): string | null {
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  );
}

/** Returns the stored logged-in user, or null if missing/corrupted. */
export function getUser(): AuthUser | null {
  const raw =
    window.localStorage.getItem(USER_KEY) ??
    window.sessionStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Sets (or clears, when companyId is null) the active company id.
 * Written to both storages so it's available regardless of which one
 * saveAuth used for the token/user.
 */
export function setActiveCompanyId(companyId: number | null) {
  if (companyId === null) {
    window.localStorage.removeItem(ACTIVE_COMPANY_KEY);
    window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
    return;
  }

  window.localStorage.setItem(
    ACTIVE_COMPANY_KEY,
    String(companyId),
  );

  window.sessionStorage.setItem(
    ACTIVE_COMPANY_KEY,
    String(companyId),
  );
}

/** Returns the active company id, or null if none is set/invalid. */
export function getActiveCompanyId(): number | null {
  const raw =
    window.localStorage.getItem(ACTIVE_COMPANY_KEY) ??
    window.sessionStorage.getItem(ACTIVE_COMPANY_KEY);

  if (!raw) return null;

  const n = Number(raw);

  return Number.isFinite(n) ? n : null;
}