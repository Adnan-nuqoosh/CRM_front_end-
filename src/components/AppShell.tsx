"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearAuth, getUser, getUserRole, hasPermission } from "@/lib/auth";
import { crmApi } from "@/lib/crmApi";

// Added optional `permission` field — if set, the nav item is only shown
// to users who have that permission. If null/undefined, shown to everyone.
type NavItem = {
  href: string;
  label: string;
  hint?: string;
  badge?: number;
  permission?: string;
};

// Sidebar navigation. Order here is the order shown in the UI.
const NAV: NavItem[] = [
  { href: "/dashboard",           label: "Dashboard"                                        },
  { href: "/companies",           label: "Companies",  hint: "Select workspace", permission: "companies.view" },
  { href: "/clients",             label: "Clients",    hint: "Customers", permission: "clients.view" },
  { href: "/document-templates",  label: "Templates",  hint: "Documents",  permission: "templates.view"  },
  { href: "/documents",           label: "Documents",  hint: "Generated PDFs", permission: "documents.view" },
  { href: "/users",               label: "Users",      hint: "Team & roles",   permission: "users.view"    },
  { href: "/tasks",               label: "Tasks",      hint: "Assignments",    permission: "tasks.view.own" },
  { href: "/activities",          label: "Audit Trail", hint: "Security history", permission: "audit-logs.view" },
];

/** Human-readable label for a role slug (e.g. "super-admin" → "Super Admin") */
function formatRole(role: string | null): string {
  if (!role) return "User";
  const UPPERCASE_WORDS = ["hr"]; // "hr-manager" -> "HR Manager", not "Hr Manager"
  return role
    .split("-")
    .map((w) =>
      UPPERCASE_WORDS.includes(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** Joins class names, skipping any falsy values. */
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Sidebar nav icons — one per NAV item. */
function Icon(props: { name: "home" | "briefcase" | "users" | "file" | "doc" | "activity"; className?: string }) {
  const common = "h-5 w-5";
  const cls = cx(common, props.className);
  switch (props.name) {
    case "home":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 8.5h16v10A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-10Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M16.5 21a4.5 4.5 0 0 0-9 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "file":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "activity":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.9 7.5 9.5 4.3-1.6 7.5-4.9 7.5-9.5V6L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M8.5 12h2l1.2-2.5 1.7 5 1.1-2.5h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "doc":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M8 8h8M8 12h8M8 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

/** Top-bar bell/mail icon button with an optional badge count. */
function TopIcon(props: { kind: "bell" | "mail"; count?: number }) {
  return (
    <button
      type="button"
      className="relative grid h-10 w-10 place-items-center rounded-lg bg-white/60 text-neutral-600 hover:bg-white hover:text-neutral-900"
      aria-label={props.kind === "bell" ? "Notifications" : "Messages"}
    >
      {props.kind === "bell" ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 22a2.2 2.2 0 0 0 2.1-1.6M5.5 18h13c-1.2-1.3-2-3-2-5V10a4.5 4.5 0 0 0-9 0v3c0 2-0.8 3.7-2 5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m6 8 6 5 6-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {props.count ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
          {props.count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Shared app shell: sidebar nav + top bar + page header, wrapped around
 * every authenticated page's content (`props.children`).
 *
 * Also enforces auth: if no user is found in storage, it redirects to
 * /login before rendering the page content.
 */
export default function AppShell(props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const router   = useRouter();
  const pathname = usePathname();

  // Start empty on the server; hydrate from browser storage after mount.
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [visibleNav, setVisibleNav] = useState<NavItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    clients: Array<{ id: number; name: string; email?: string | null }>;
    templates: Array<{ id: number; name: string; category?: string | null }>;
    documents: Array<{ id: number; contract_number?: string; status?: string }>;
    tasks: Array<{ id: number; title: string; status?: string }>;
  } | null>(null);

  // Close overlays during render when the route changes (React-approved pattern).
  const [overlayPathname, setOverlayPathname] = useState(pathname);
  if (pathname !== overlayPathname) {
    setOverlayPathname(pathname);
    setMobileSidebarOpen(false);
    setMenuOpen(false);
  }

  // Hydrate auth + sidebar preference from browser storage (client only).
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setSidebarCollapsed(window.localStorage.getItem("nuqoosh.sidebarCollapsed") === "1");
      } catch {
        // Ignore storage access errors.
      }

      const user = getUser();
      if (!user) {
        setAuthReady(true);
        router.replace("/login");
        return;
      }

      setName(user.name);
      setEmail(user.email);
      setUserRole(getUserRole());
      setVisibleNav(NAV.filter((item) => !item.permission || hasPermission(item.permission)));
      setAuthReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [router]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        setSearchResults(await crmApi.search(query));
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Persist the sidebar's collapsed/expanded preference whenever it changes.
  useEffect(() => {
    if (!authReady) return;
    try {
      window.localStorage.setItem("nuqoosh.sidebarCollapsed", sidebarCollapsed ? "1" : "0");
    } catch {
      // Ignore storage access errors.
    }
  }, [sidebarCollapsed, authReady]);

  async function handleLogout() {
    setMenuOpen(false);
    try {
      await crmApi.auth.logout();
    } catch {
      // Clear the local session even when the API is temporarily unavailable.
    } finally {
      clearAuth();
      router.replace("/login");
    }
  }

  // Page header (title/subtitle): use explicit props if given, otherwise
  // fall back to the matching NAV entry for the current route.
  const header = useMemo(() => {
    if (props.title) return { title: props.title, subtitle: props.subtitle };
    const item = NAV.find((n) => n.href === pathname);
    return { title: item?.label ?? "Workspace", subtitle: item?.hint };
  }, [pathname, props.subtitle, props.title]);

  return (
    <main className="h-dvh overflow-hidden bg-[#f4f6fb] text-neutral-900">
      <div
        className={cx(
          "relative grid h-dvh grid-cols-1",
          sidebarCollapsed ? "lg:grid-cols-[88px_1fr]" : "lg:grid-cols-[280px_1fr]",
        )}
      >
        {/* Mobile backdrop (closes sidebar on click) */}
        {mobileSidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        ) : null}
        {/* ══════════════════════════════════════════
            SIDEBAR
        ══════════════════════════════════════════ */}
        <aside
          className={cx(
            "z-50 flex h-dvh flex-col overflow-y-auto bg-[#0b1f3a] text-white",
            // Mobile drawer behavior (<1024px): hidden by default, slide in when opened
            "fixed inset-y-0 left-0 w-[280px] -translate-x-full transition-transform duration-200 ease-out lg:static lg:w-auto lg:translate-x-0",
            mobileSidebarOpen ? "translate-x-0" : "",
          )}
        >
          {/* Logo */}
          <div className={cx("px-6 py-6", sidebarCollapsed ? "px-3" : "")}>
            <div className={cx("flex items-center justify-between gap-3", sidebarCollapsed ? "justify-center" : "")}>
              <Link href="/dashboard" className={cx("block", sidebarCollapsed ? "px-1" : "")}>
                <Image
                  src="/logo/nuqoosh-white logo.png"
                  alt="Nuqoosh"
                  width={180}
                  height={56}
                  className={cx("object-contain", sidebarCollapsed ? "h-9 w-9" : "h-12 w-auto")}
                  priority
                />
              </Link>

              {/* Mobile close button */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white/90 hover:bg-white/15 lg:hidden"
                aria-label="Close sidebar"
                title="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Nav links — only items the user has permission to see */}
          <nav className="flex-1 px-3">
            <div className="space-y-1">
              {visibleNav.map((item) => {
                // Highlight "Documents" for both /documents and /documents/generate.
                const active =
                  pathname === item.href ||
                  (item.href === "/documents" && pathname.startsWith("/documents"));

                const iconName =
                  item.href === "/dashboard"
                    ? ("home" as const)
                    : item.href === "/companies"
                      ? ("briefcase" as const)
                      : item.href === "/clients" || item.href === "/users"
                        ? ("users" as const)
                        : item.href === "/document-templates"
                          ? ("file" as const)
                          : item.href === "/activities"
                            ? ("activity" as const)
                            : ("doc" as const);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cx(
                      "flex items-center justify-between rounded-xl px-3 py-3 text-sm transition",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cx(
                          "grid h-9 w-9 place-items-center rounded-lg",
                          active ? "bg-white/10" : "bg-white/5",
                        )}
                      >
                        <Icon
                          name={iconName}
                          className={active ? "text-white" : "text-white/80"}
                        />
                      </span>
                      {sidebarCollapsed ? null : (
                        <span className={active ? "font-semibold" : "font-medium"}>
                          {item.label}
                        </span>
                      )}
                    </span>
                    {!sidebarCollapsed && typeof item.badge === "number" ? (
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#f4c35a] px-2 text-xs font-bold text-[#0b1f3a]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User / logout footer */}
          <div
            className={cx(
              "mt-auto border-t border-white/10",
              sidebarCollapsed ? "px-3 py-4" : "px-6 py-5",
            )}
          >
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="grid w-full place-items-center rounded-xl bg-white/5 py-3 text-white/85 hover:bg-white/10 hover:text-white"
                title={name ? `${name}${email ? ` — ${email}` : ""}` : "Logout"}
                aria-label="Logout"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                  {(name?.[0] ?? "U").toUpperCase()}
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-white/60">SIGNED IN</p>
                  <p className="mt-2 truncate text-sm font-semibold text-white">{name ?? "—"}</p>
                  <p className="mt-1 truncate text-xs text-white/60">{email ?? ""}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label="Logout"
                  title="Logout"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M10 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 12H4m0 0 3-3m-3 3 3 3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Floating button (desktop only) that toggles the sidebar collapse state. */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          className={cx(
            "absolute top-7 z-50 hidden h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100 lg:grid",
            sidebarCollapsed ? "left-[76px]" : "left-[268px]",
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {sidebarCollapsed ? (
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M15 18 9 12l6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>

        {/* ══════════════════════════════════════════
            MAIN COLUMN — top bar + page content
        ══════════════════════════════════════════ */}
        <div className="min-w-0 overflow-y-auto">
          <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-[#f4f6fb]">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
              {/* Search box (UI only — not wired to a search endpoint yet) */}
              <div className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="mr-3 grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 bg-white/70 text-neutral-700 hover:bg-white hover:text-neutral-900 active:bg-neutral-100 lg:hidden"
                  aria-label="Open sidebar"
                  title="Menu"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="relative w-full max-w-xl">
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search clients, templates, documents or tasks"
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white/70 pl-11 pr-12 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white"
                  />
                  {searching ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">Searching…</span> : null}
                  {searchResults && searchQuery.trim().length >= 2 ? (
                    <div className="absolute left-0 right-0 top-12 z-50 max-h-[420px] overflow-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl">
                      {[
                        { label: "Clients", href: "/clients", items: searchResults.clients, name: (item: { name: string }) => item.name },
                        { label: "Templates", href: "/document-templates", items: searchResults.templates, name: (item: { name: string }) => item.name },
                        { label: "Documents", href: "/documents", items: searchResults.documents, name: (item: { contract_number?: string }) => item.contract_number || "Document" },
                        { label: "Tasks", href: "/tasks", items: searchResults.tasks, name: (item: { title: string }) => item.title },
                      ].map((group) => group.items.length ? (
                        <div key={group.label} className="p-2">
                          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">{group.label}</p>
                          {group.items.map((item) => (
                            <Link key={`${group.label}-${item.id}`} href={group.href} onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="block rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                              {group.name(item as never)}
                            </Link>
                          ))}
                        </div>
                      ) : null)}
                      {[searchResults.clients, searchResults.templates, searchResults.documents, searchResults.tasks].every((items) => items.length === 0) ? (
                        <p className="px-4 py-8 text-center text-sm text-neutral-400">No results found.</p>
                      ) : null}
                    </div>
                  ) : null}
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M16.2 16.2 21 21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Notifications, messages, and user menu */}
              <div className="flex items-center gap-2">
                <TopIcon kind="bell" />
                <TopIcon kind="mail" />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/70"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-200">
                      <div className="grid h-full w-full place-items-center text-sm font-semibold text-neutral-600">
                        {(name?.[0] ?? "U").toUpperCase()}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-neutral-900">{name ?? "User"}</p>
                      {/* Shows actual role instead of hardcoded "Admin" */}
                      <p className="text-xs text-neutral-500">{formatRole(userRole)}</p>
                    </div>
                    <svg
                      className="hidden h-4 w-4 text-neutral-500 sm:block"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m7 10 5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>

                  {menuOpen ? (
                    <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold tracking-wide text-neutral-500">
                          CURRENT PAGE
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {header.title}
                        </p>
                      </div>
                      <div className="border-t border-neutral-200">
                        <button
                          type="button"
                          onClick={() => void handleLogout()}
                          className="w-full px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Page title/subtitle */}
            <div className="mx-auto max-w-6xl px-6 pb-5">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                {header.title}
              </h1>
              {header.subtitle ? (
                <p className="mt-2 text-sm text-neutral-600">{header.subtitle}</p>
              ) : null}
            </div>
          </header>

          {/* Page content */}
          <section className="mx-auto max-w-6xl px-6 py-8">{props.children}</section>
        </div>
      </div>
    </main>
  );
}