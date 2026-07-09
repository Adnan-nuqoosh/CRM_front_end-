"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type ManagedUser, type AssignableRole, type Company } from "@/lib/crmApi";
import { getUser, getUserRole, hasPermission } from "@/lib/auth";

/** "hr-manager" -> "HR Manager" (same convention as AppShell) */
function formatRole(role: string | null): string {
  if (!role) return "—";
  const UPPERCASE_WORDS = ["hr"];
  return role
    .split("-")
    .map((w) =>
      UPPERCASE_WORDS.includes(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

// Role hierarchy — mirrors UserController::ROLE_LEVELS on the backend.
// Lower number = higher privilege. Used to hide Edit/Delete buttons on rows
// the backend would reject anyway (peers and superiors), so an admin never
// even sees an Edit button on a super-admin's row.
const ROLE_LEVELS: Record<string, number> = {
  "super-admin":    1,
  "admin":          2,
  "hr-manager":     3,
  "office-manager": 3,
  "employee":       4,
};

function canManageTarget(myRole: string | null, targetRole: string | null): boolean {
  const mine   = ROLE_LEVELS[myRole ?? ""] ?? 99;
  const theirs = ROLE_LEVELS[targetRole ?? ""] ?? 99;
  return theirs > mine; // strictly below me only
}

// Badge colors per role for the table
const ROLE_COLORS: Record<string, string> = {
  "super-admin":    "bg-red-50 text-red-700 border border-red-200",
  "admin":          "bg-blue-50 text-blue-700 border border-blue-200",
  "hr-manager":     "bg-purple-50 text-purple-700 border border-purple-200",
  "office-manager": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "employee":       "bg-neutral-100 text-neutral-600 border border-neutral-200",
};

const inputClass =
  "h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10";

export default function UsersPage() {
  // ── List state ───────────────────────────────────────────────────────────
  const [users, setUsers]     = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Permission flags + current user (for self-row protection) ───────────
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit]     = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [myId, setMyId]           = useState<number | null>(null);
  const [myRole, setMyRole]       = useState<string | null>(null);

  // ── Shared form data ─────────────────────────────────────────────────────
  const [roles, setRoles]         = useState<AssignableRole[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // ── Create form state ─────────────────────────────────────────────────────
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [role, setRole]               = useState("");
  const [companyIds, setCompanyIds]   = useState<number[]>([]);
  const [submitting, setSubmitting]   = useState(false);

  // ── Edit modal state (null = closed) ─────────────────────────────────────
  const [editing, setEditing]             = useState<ManagedUser | null>(null);
  const [editName, setEditName]           = useState("");
  const [editEmail, setEditEmail]         = useState("");
  const [editPassword, setEditPassword]   = useState("");
  const [editRole, setEditRole]           = useState("");
  const [editCompanyIds, setEditCompanyIds] = useState<number[]>([]);
  const [savingEdit, setSavingEdit]       = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canSubmitCreate = useMemo(
    () =>
      canCreate &&
      name.trim().length > 1 &&
      email.trim().length > 3 &&
      password.length >= 8 &&
      role.length > 0 &&
      companyIds.length > 0 &&
      !submitting,
    [canCreate, name, email, password, role, companyIds, submitting],
  );

  useEffect(() => {
    setCanCreate(hasPermission("users.create"));
    setCanEdit(hasPermission("users.edit"));
    setCanDelete(hasPermission("users.delete"));
    setMyId(getUser()?.id ?? null);
    setMyRole(getUserRole());
  }, []);

  /** Loads the user list. */
  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const data = await crmApi.users.list();
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  // Load users + form data (roles/companies) once on mount.
  useEffect(() => {
    void refresh();

    async function loadFormData() {
      try {
        const [rolesRes, companiesRes] = await Promise.allSettled([
          crmApi.users.assignableRoles(),
          crmApi.companies.list(),
        ]);
        if (rolesRes.status === "fulfilled") setRoles(rolesRes.value);
        if (companiesRes.status === "fulfilled") setCompanies(companiesRes.value.companies);
      } catch {
        // Roles fetch fails for roles without users.create (e.g. viewing-only)
        // — the create form is hidden for them anyway.
      }
    }
    void loadFormData();
  }, []);

  function toggleCompany(id: number, list: number[], setList: (v: number[]) => void) {
    setList(list.includes(id) ? list.filter((c) => c !== id) : [...list, id]);
  }

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  // ── Create ────────────────────────────────────────────────────────────────
  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmitCreate) return;

    setSubmitting(true);
    setError(null);

    try {
      await crmApi.users.create({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        company_ids: companyIds,
      });

      setName(""); setEmail(""); setPassword(""); setRole(""); setCompanyIds([]);
      flashSuccess("User created successfully!");
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function openEdit(u: ManagedUser) {
    setEditing(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword("");
    setEditRole(u.role ?? "");
    setEditCompanyIds(u.companies.map((c) => c.id));
  }

  async function onSaveEdit() {
    if (!editing) return;

    setSavingEdit(true);
    setError(null);

    try {
      await crmApi.users.update(editing.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        ...(editPassword.length >= 8 ? { password: editPassword } : {}),
        ...(editRole ? { role: editRole } : {}),
        ...(editCompanyIds.length > 0 ? { company_ids: editCompanyIds } : {}),
      });

      setEditing(null);
      flashSuccess("User updated successfully!");
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update user.");
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function onDelete(u: ManagedUser) {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;

    setDeletingId(u.id);
    setError(null);

    try {
      await crmApi.users.delete(u.id);
      flashSuccess("User deleted successfully!");
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell title="Users" subtitle="Manage team members, roles, and company access.">

      {/* ── Alerts ── */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm font-medium text-emerald-700">{success}</p>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${canCreate ? "xl:grid-cols-[1fr_380px]" : ""}`}>

        {/* ══════════════════════════════════════════
            LEFT — User table
        ══════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Team</p>
              <p className="mt-1 text-sm text-neutral-500">
                {loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"/>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    <th className="border-b border-neutral-200 px-5 py-3">Name</th>
                    <th className="border-b border-neutral-200 px-5 py-3">Role</th>
                    <th className="border-b border-neutral-200 px-5 py-3">Companies</th>
                    <th className="border-b border-neutral-200 px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf     = u.id === myId;
                    const manageable = !isSelf && canManageTarget(myRole, u.role);
                    return (
                      <tr key={u.id} className="hover:bg-neutral-50">
                        <td className="border-b border-neutral-100 px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#0b1f3a]/5 text-sm font-semibold text-[#0b1f3a]">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-neutral-900">
                                {u.name}
                                {isSelf && <span className="ml-2 text-xs font-normal text-neutral-400">(you)</span>}
                              </p>
                              <p className="truncate text-xs text-neutral-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-neutral-100 px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role ?? ""] ?? "bg-neutral-100 text-neutral-600 border border-neutral-200"}`}>
                            {formatRole(u.role)}
                          </span>
                        </td>
                        <td className="border-b border-neutral-100 px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {u.companies.map((c) => (
                              <span key={c.id} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="border-b border-neutral-100 px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && manageable && (
                              <button
                                type="button"
                                onClick={() => openEdit(u)}
                                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-[#0b1f3a] hover:text-[#0b1f3a]"
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && manageable && (
                              <button
                                type="button"
                                onClick={() => void onDelete(u)}
                                disabled={deletingId === u.id}
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                              >
                                {deletingId === u.id ? "Deleting…" : "Delete"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Create user (users.create only)
        ══════════════════════════════════════════ */}
        {canCreate && (
          <div className="h-fit rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">New User</p>
              <h2 className="mt-1 text-base font-semibold text-neutral-900">Create user</h2>
              <p className="mt-0.5 text-xs text-neutral-500">The role dropdown only contains the roles you can assign.</p>
            </div>

            <form onSubmit={onCreate} className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className={inputClass}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Password * <span className="font-normal normal-case text-neutral-400">(min 8 chars)</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Role *</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                  <option value="">Select role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>{formatRole(r.name)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Companies *</label>
                <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                  {companies.map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={companyIds.includes(c.id)}
                        onChange={() => toggleCompany(c.id, companyIds, setCompanyIds)}
                        className="h-4 w-4 rounded border-neutral-300 accent-[#0b1f3a]"
                      />
                      {c.name}
                    </label>
                  ))}
                  {companies.length === 0 && (
                    <p className="text-xs text-neutral-400">Loading companies…</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmitCreate}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] text-sm font-semibold text-white transition hover:bg-[#0d2444] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Creating…
                  </>
                ) : "Create user"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════ */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => !savingEdit && setEditing(null)}>
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-900">Edit user</h2>
              <p className="mt-0.5 text-xs text-neutral-500">{editing.email}</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputClass}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  New Password <span className="font-normal normal-case text-neutral-400">(blank = unchanged)</span>
                </label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="••••••••" className={inputClass}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={inputClass}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>{formatRole(r.name)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Companies</label>
                <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                  {companies.map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={editCompanyIds.includes(c.id)}
                        onChange={() => toggleCompany(c.id, editCompanyIds, setEditCompanyIds)}
                        className="h-4 w-4 rounded border-neutral-300 accent-[#0b1f3a]"
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={savingEdit}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onSaveEdit()}
                disabled={savingEdit || editName.trim().length < 2 || editCompanyIds.length === 0}
                className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d2444] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}