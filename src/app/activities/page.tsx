"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Activity } from "@/lib/crmApi";

function formatAction(action: string) {
  return action
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setActivities(await crmApi.activities.list({ search: search.trim() || undefined }));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to load audit history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const uniqueUsers = useMemo(
    () => new Set(activities.map((activity) => activity.user?.id).filter(Boolean)).size,
    [activities],
  );

  return (
    <AppShell title="Audit Trail" subtitle="A tamper-resistant history of important CRM actions.">
      {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Visible events</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{activities.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Team members</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{uniqueUsers}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Data protection</p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">Company-scoped logs</p>
          <p className="mt-1 text-xs text-neutral-400">Includes actor, IP and changed values.</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-neutral-900">Activity history</h2>
            <p className="mt-0.5 text-xs text-neutral-400">Newest activity appears first.</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search action, user or description"
            className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[#0b1f3a] sm:w-80"
          />
        </div>

        {loading ? (
          <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-neutral-100" />)}</div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-400">No matching activity found.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {activities.map((activity) => (
              <article key={activity.id} className="grid gap-3 px-5 py-4 hover:bg-neutral-50/70 md:grid-cols-[180px_minmax(0,1fr)_220px] md:items-center">
                <div>
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{formatAction(activity.action)}</span>
                  <p className="mt-2 text-xs text-neutral-400">{formatDate(activity.created_at)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800">{activity.description || "CRM action recorded"}</p>
                  {activity.subject_type ? <p className="mt-1 truncate text-xs text-neutral-400">{activity.subject_type.split("\\").pop()} #{activity.subject_id ?? "—"}</p> : null}
                </div>
                <div className="md:text-right">
                  <p className="text-sm font-semibold text-neutral-800">{activity.user?.name ?? "System"}</p>
                  <p className="text-xs text-neutral-400">{activity.ip_address || activity.user?.email || "—"}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
