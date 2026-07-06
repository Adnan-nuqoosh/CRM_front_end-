"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Task, type AssignableUser, type Company } from "@/lib/crmApi";
import { getUser, hasPermission } from "@/lib/auth";

// Status badge colors + labels
const STATUS_META: Record<Task["status"], { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  completed:   { label: "Completed",   cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

const inputClass =
  "h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export default function TasksPage() {
  // ── Permission flags ──────────────────────────────────────────────────────
  const [canViewAll, setCanViewAll] = useState(false);
  const [canCreate, setCanCreate]   = useState(false);
  const [canDelete, setCanDelete]   = useState(false);
  const [myId, setMyId]             = useState<number | null>(null);

  // ── View state ────────────────────────────────────────────────────────────
  // Managers can flip between the active company's tasks and their own.
  const [view, setView]             = useState<"company" | "own">("company");
  const [statusFilter, setStatusFilter] = useState<"" | Task["status"]>("");

  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Create form state ─────────────────────────────────────────────────────
  const [companies, setCompanies]       = useState<Company[]>([]);
  const [assignees, setAssignees]       = useState<AssignableUser[]>([]);
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [companyId, setCompanyId]       = useState<number | null>(null);
  const [assignedTo, setAssignedTo]     = useState<number | null>(null);
  const [dueDate, setDueDate]           = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canSubmit = useMemo(
    () =>
      canCreate &&
      title.trim().length > 1 &&
      companyId !== null &&
      assignedTo !== null &&
      !submitting,
    [canCreate, title, companyId, assignedTo, submitting],
  );

  useEffect(() => {
    const viewAll = hasPermission("tasks.view.all");
    setCanViewAll(viewAll);
    setCanCreate(hasPermission("tasks.create"));
    setCanDelete(hasPermission("tasks.delete"));
    setMyId(getUser()?.id ?? null);
    // Employees (no view.all) only have the "own" view
    if (!viewAll) setView("own");
  }, []);

  /** Loads tasks for the current view + filter. */
  const refresh = useCallback(async (v: "company" | "own", status: "" | Task["status"]) => {
    setError(null);
    setLoading(true);
    try {
      const data = await crmApi.tasks.list({
        ...(v === "own" ? { scope: "own" as const } : {}),
        ...(status ? { status } : {}),
      });
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever view or filter changes (after permission flags settle)
  useEffect(() => {
    void refresh(view, statusFilter);
  }, [view, statusFilter, refresh]);

  // Load companies for the create form (creators only)
  useEffect(() => {
    if (!hasPermission("tasks.create")) return;
    async function loadCompanies() {
      try {
        const res = await crmApi.companies.list();
        setCompanies(res.companies);
      } catch {
        // form stays without companies; error surfaces on submit
      }
    }
    void loadCompanies();
  }, []);

  // When the form's company changes, load that company's members
  useEffect(() => {
    if (companyId === null) {
      setAssignees([]);
      setAssignedTo(null);
      return;
    }
    let cancelled = false;
    async function loadAssignees() {
      setLoadingAssignees(true);
      setAssignedTo(null);
      try {
        const data = await crmApi.tasks.assignableUsers(companyId as number);
        if (!cancelled) setAssignees(data);
      } catch {
        if (!cancelled) setAssignees([]);
      } finally {
        if (!cancelled) setLoadingAssignees(false);
      }
    }
    void loadAssignees();
    return () => { cancelled = true; };
  }, [companyId]);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  // ── Create ────────────────────────────────────────────────────────────────
  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || companyId === null || assignedTo === null) return;

    setSubmitting(true);
    setError(null);

    try {
      await crmApi.tasks.create({
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        company_id: companyId,
        assigned_to: assignedTo,
        ...(dueDate ? { due_date: dueDate } : {}),
      });

      setTitle(""); setDescription(""); setDueDate("");
      setAssignedTo(null);
      flashSuccess("Task assigned successfully!");
      await refresh(view, statusFilter);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Status change ─────────────────────────────────────────────────────────
  async function onStatusChange(task: Task, status: Task["status"]) {
    setUpdatingId(task.id);
    setError(null);
    try {
      await crmApi.tasks.updateStatus(task.id, status);
      await refresh(view, statusFilter);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update task.");
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function onDelete(task: Task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    setDeletingId(task.id);
    setError(null);
    try {
      await crmApi.tasks.delete(task.id);
      flashSuccess("Task deleted.");
      await refresh(view, statusFilter);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete task.");
    } finally {
      setDeletingId(null);
    }
  }

  /** Which status buttons a row shows, based on current status + ownership. */
  function statusActions(t: Task) {
    const isMine  = t.assigned_to === myId;
    // Employees can act on their own tasks; managers on anything visible here
    const canAct  = canViewAll || isMine;
    if (!canAct) return null;

    const busy = updatingId === t.id;

    return (
      <div className="flex items-center justify-end gap-2">
        {t.status === "pending" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onStatusChange(t, "in_progress")}
            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-40"
          >
            Start
          </button>
        )}
        {t.status === "in_progress" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onStatusChange(t, "completed")}
            className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
          >
            Complete
          </button>
        )}
        {t.status === "completed" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onStatusChange(t, "in_progress")}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
          >
            Reopen
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            disabled={deletingId === t.id}
            onClick={() => void onDelete(t)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            {deletingId === t.id ? "…" : "Delete"}
          </button>
        )}
      </div>
    );
  }

  return (
    <AppShell title="Tasks" subtitle="Assign work and track completion across companies.">

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
            LEFT — Task list
        ══════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* View tabs + status filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              {canViewAll && (
                <>
                  <button
                    type="button"
                    onClick={() => setView("company")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      view === "company"
                        ? "bg-[#0b1f3a] text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#0b1f3a]"
                    }`}
                  >
                    Company Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("own")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      view === "own"
                        ? "bg-[#0b1f3a] text-white"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#0b1f3a]"
                    }`}
                  >
                    My Tasks
                  </button>
                </>
              )}
              {!canViewAll && (
                <p className="text-sm font-semibold text-neutral-700">My Tasks</p>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | Task["status"])}
              className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-[#0b1f3a]"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"/>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
              <svg className="mx-auto h-10 w-10 text-neutral-300" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="mt-3 text-sm font-semibold text-neutral-500">No tasks found</p>
              <p className="mt-1 text-xs text-neutral-400">
                {view === "own" ? "Nothing assigned to you right now." : "No tasks in this company yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => {
                const meta = STATUS_META[t.status];
                return (
                  <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm font-semibold ${t.status === "completed" ? "text-neutral-400 line-through" : "text-neutral-900"}`}>
                            {t.title}
                          </p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
                            {meta.label}
                          </span>
                          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                            {t.company_name ?? `Company #${t.company_id}`}
                          </span>
                        </div>

                        {t.description && (
                          <p className="mt-1.5 text-sm text-neutral-500">{t.description}</p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
                          <span>
                            Assigned to: <span className="font-medium text-neutral-600">{t.assignee_name ?? "—"}</span>
                          </span>
                          <span>
                            By: <span className="font-medium text-neutral-600">{t.assigner_name ?? "—"}</span>
                          </span>
                          {t.due_date && (
                            <span>
                              Due: <span className="font-medium text-neutral-600">{formatDate(t.due_date)}</span>
                            </span>
                          )}
                          {t.completed_at && (
                            <span>
                              Completed: <span className="font-medium text-emerald-600">{formatDate(t.completed_at)}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">{statusActions(t)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Assign task (tasks.create only)
        ══════════════════════════════════════════ */}
        {canCreate && (
          <div className="h-fit rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">New Task</p>
              <h2 className="mt-1 text-base font-semibold text-neutral-900">Assign task</h2>
              <p className="mt-0.5 text-xs text-neutral-500">Company select karo — us ke members dropdown mein aa jayenge.</p>
            </div>

            <form onSubmit={onCreate} className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prepare VMC contract draft" className={inputClass}/>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Details, links, requirements…"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-neutral-300 focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Company *</label>
                <select
                  value={companyId ?? ""}
                  onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                >
                  <option value="">Select company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Assign to *</label>
                <select
                  value={assignedTo ?? ""}
                  onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
                  disabled={companyId === null || loadingAssignees}
                  className={`${inputClass} disabled:bg-neutral-50 disabled:text-neutral-400`}
                >
                  <option value="">
                    {companyId === null
                      ? "Select a company first…"
                      : loadingAssignees
                        ? "Loading members…"
                        : "Select member…"}
                  </option>
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Due date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass}/>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] text-sm font-semibold text-white transition hover:bg-[#0d2444] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Assigning…
                  </>
                ) : "Assign task"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}