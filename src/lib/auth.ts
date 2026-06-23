// export type AuthUser = {
//   id: number;
//   name: string;
//   email: string;
// };

// export type LoginResponse = {
//   token: string;
//   user: AuthUser;
// };

// const TOKEN_KEY = "nuqoosh.token";
// const USER_KEY = "nuqoosh.user";
// const ACTIVE_COMPANY_KEY = "nuqoosh.active_company_id";

// export function saveAuth(args: { token: string; user: AuthUser; remember: boolean }) {
//   // Use localStorage so auth works across tabs/windows.
//   // (sessionStorage is per-tab, which can feel like "random logout" when opening /dashboard directly).
//   window.localStorage.setItem(TOKEN_KEY, args.token);
//   window.localStorage.setItem(USER_KEY, JSON.stringify(args.user));

//   // Clear any legacy session-only auth.
//   window.sessionStorage.removeItem(TOKEN_KEY);
//   window.sessionStorage.removeItem(USER_KEY);
// }

// export function clearAuth() {
//   window.localStorage.removeItem(TOKEN_KEY);
//   window.localStorage.removeItem(USER_KEY);
//   window.localStorage.removeItem(ACTIVE_COMPANY_KEY);
//   window.sessionStorage.removeItem(TOKEN_KEY);
//   window.sessionStorage.removeItem(USER_KEY);
//   window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
// }

// export function getToken(): string | null {
//   return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
// }

// export function getUser(): AuthUser | null {
//   const raw = window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
//   if (!raw) return null;
//   try {
//     return JSON.parse(raw) as AuthUser;
//   } catch {
//     return null;
//   }
// }

// export function setActiveCompanyId(companyId: number | null) {
//   if (companyId === null) {
//     window.localStorage.removeItem(ACTIVE_COMPANY_KEY);
//     window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
//     return;
//   }
//   window.localStorage.setItem(ACTIVE_COMPANY_KEY, String(companyId));
//   window.sessionStorage.setItem(ACTIVE_COMPANY_KEY, String(companyId));
// }

// export function getActiveCompanyId(): number | null {
//   const raw = window.localStorage.getItem(ACTIVE_COMPANY_KEY) ?? window.sessionStorage.getItem(ACTIVE_COMPANY_KEY);
//   if (!raw) return null;
//   const n = Number(raw);
//   return Number.isFinite(n) ? n : null;
// }

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

export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ACTIVE_COMPANY_KEY);

  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
}

export function getToken(): string | null {
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  );
}

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

export function getActiveCompanyId(): number | null {
  const raw =
    window.localStorage.getItem(ACTIVE_COMPANY_KEY) ??
    window.sessionStorage.getItem(ACTIVE_COMPANY_KEY);

  if (!raw) return null;

  const n = Number(raw);

  return Number.isFinite(n) ? n : null;
}