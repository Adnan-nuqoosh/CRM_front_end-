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
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  is_active?: boolean;
  active_company_id?: number | null;
};

export type LoginResponse = {
  token: string;
  token_type: "Bearer";
  user: AuthUser;
  roles: string[];
  role?: string | null;
  role_display_name?: string | null;
  permissions: string[];
  companies: Array<{ id: number; name: string }>;
  active_company_id: number | null;
};

const TOKEN_KEY          = "nuqoosh.token";
const USER_KEY           = "nuqoosh.user";
const ACTIVE_COMPANY_KEY = "nuqoosh.active_company_id";
const ROLE_KEY           = "nuqoosh.role";        // primary role slug e.g. "super-admin"
const PERMISSIONS_KEY    = "nuqoosh.permissions"; // JSON array of permission strings

/**
 * Saves the token + user after a successful login.
 * Writes to localStorage if "remember" is checked, otherwise sessionStorage.
 * Always clears both storages first so a previous session can't linger.
 *
 * Also saves the first role and full permissions list so UI gating works
 * immediately after login without a separate /me call.
 */
export function saveAuth(args: {
  token: string;
  user: AuthUser;
  remember: boolean;
  roles?: string[];
  permissions?: string[];
  activeCompanyId?: number | null;
}) {
  if (typeof window === "undefined") return;

  const storage = args.remember
    ? window.localStorage
    : window.sessionStorage;

  // Clear both storages before writing (prevents stale session lingering)
  [window.localStorage, window.sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(USER_KEY);
    s.removeItem(ROLE_KEY);
    s.removeItem(PERMISSIONS_KEY);
    s.removeItem(ACTIVE_COMPANY_KEY);
  });

  storage.setItem(TOKEN_KEY, args.token);
  storage.setItem(USER_KEY, JSON.stringify(args.user));

  // Store primary role (first in array) and full permissions list
  if (args.roles && args.roles.length > 0) {
    storage.setItem(ROLE_KEY, args.roles[0]);
  }
  if (args.permissions && args.permissions.length > 0) {
    storage.setItem(PERMISSIONS_KEY, JSON.stringify(args.permissions));
  }
  if (typeof args.activeCompanyId === "number") {
    storage.setItem(ACTIVE_COMPANY_KEY, String(args.activeCompanyId));
  }
}

/** Clears all auth + active-company data from both storages (used on logout). */
export function clearAuth() {
  if (typeof window === "undefined") return;

  [window.localStorage, window.sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(USER_KEY);
    s.removeItem(ACTIVE_COMPANY_KEY);
    s.removeItem(ROLE_KEY);
    s.removeItem(PERMISSIONS_KEY);
  });
}

/** Returns the stored auth token, checking localStorage then sessionStorage. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  );
}

/** Returns the stored logged-in user, or null if missing/corrupted. */
export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

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
  if (typeof window === "undefined") return;

  if (companyId === null) {
    window.localStorage.removeItem(ACTIVE_COMPANY_KEY);
    window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
    return;
  }

  const storage = window.localStorage.getItem(TOKEN_KEY)
    ? window.localStorage
    : window.sessionStorage;
  window.localStorage.removeItem(ACTIVE_COMPANY_KEY);
  window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
  storage.setItem(ACTIVE_COMPANY_KEY, String(companyId));
}

/** Returns the active company id, or null if none is set/invalid. */
export function getActiveCompanyId(): number | null {
  if (typeof window === "undefined") return null;

  const raw =
    window.localStorage.getItem(ACTIVE_COMPANY_KEY) ??
    window.sessionStorage.getItem(ACTIVE_COMPANY_KEY);

  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// ════════════════════════════════════════════════════════════════════════════
// ROLE & PERMISSION HELPERS
// Used to gate UI elements (show/hide buttons, restrict page access) based
// on the logged-in user's role and permissions stored after login.
//
// Usage examples:
//   hasPermission('documents.delete')  → show Delete button
//   hasPermission('templates.create')  → show Create Template button
//   hasPermission('analytics.view')    → allow Analytics page access
//   getUserRole()                      → 'super-admin' | 'admin' | etc.
//   hasRole('super-admin')             → true/false
// ════════════════════════════════════════════════════════════════════════════

/**
 * Returns the user's primary role slug (e.g. "super-admin", "admin",
 * "hr-manager", "office-manager", "employee"), or null if not set.
 */
export function getUserRole(): string | null {
  if (typeof window === "undefined") return null;

  return (
    window.localStorage.getItem(ROLE_KEY) ??
    window.sessionStorage.getItem(ROLE_KEY)
  );
}

/**
 * Returns true if the user's primary role matches the given slug.
 * Comparison is case-insensitive.
 *
 * @example hasRole('super-admin')
 */
export function hasRole(role: string): boolean {
  const current = getUserRole();
  if (!current) return false;
  return current.toLowerCase() === role.toLowerCase();
}

/**
 * Returns the full list of permission strings for the logged-in user,
 * or an empty array if none are stored.
 */
export function getUserPermissions(): string[] {
  if (typeof window === "undefined") return [];

  const raw =
    window.localStorage.getItem(PERMISSIONS_KEY) ??
    window.sessionStorage.getItem(PERMISSIONS_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/**
 * Returns true if the logged-in user has the given permission.
 *
 * @example hasPermission('documents.delete')
 * @example hasPermission('templates.create')
 * @example hasPermission('analytics.view')
 */
export function hasPermission(permission: string): boolean {
  return getUserPermissions().includes(permission);
}

/**
 * Returns true if the user has ALL of the given permissions.
 * Useful when a UI element requires multiple permissions at once.
 *
 * @example hasAllPermissions(['templates.edit', 'templates.delete'])
 */
export function hasAllPermissions(permissions: string[]): boolean {
  const userPerms = getUserPermissions();
  return permissions.every((p) => userPerms.includes(p));
}

/**
 * Returns true if the user has ANY of the given permissions.
 * Useful for showing a section when at least one action is allowed.
 *
 * @example hasAnyPermission(['documents.generate', 'documents.delete'])
 */
export function hasAnyPermission(permissions: string[]): boolean {
  const userPerms = getUserPermissions();
  return permissions.some((p) => userPerms.includes(p));
}