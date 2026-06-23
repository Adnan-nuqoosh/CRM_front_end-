"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Company } from "@/lib/crmApi";
import { getActiveCompanyId, setActiveCompanyId } from "@/lib/auth";

export default function CompaniesPage() {
  // ── List state ───────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId]   = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  // ── Create-company form state ───────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const canCreate = useMemo(() => name.trim().length > 1 && !submitting, [name, submitting]);

  /** Fetches the user's companies and syncs the active company id. */
  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const res = await crmApi.companies.list();
      setCompanies(res.companies);
      setActiveId(res.active_company_id ?? getActiveCompanyId());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }

  // Load the company list once on mount.
  useEffect(() => {
    void refresh();
  }, []);

  /** Switches the active company for this user. */
  async function onSelect(companyId: number) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await crmApi.companies.select(companyId);
      setActiveCompanyId(res.active_company_id);
      setActiveId(res.active_company_id);
      setSuccess("Company switched successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to select company.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canCreate) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await crmApi.companies.create({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      // If the backend marks the new company active, sync locally too.
      if (typeof res.active_company_id === "number") {
        setActiveCompanyId(res.active_company_id);
        setActiveId(res.active_company_id);
      }

      setName("");
      setEmail("");
      setPhone("");

      setSuccess("Company created successfully!");
      setTimeout(() => setSuccess(null), 3000);

      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create company.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Companies" subtitle="Select an active company to unlock CRM modules.">

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">

        {/* ══════════════════════════════════════════
            LEFT — Company List
        ══════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Workspaces</p>
              <p className="mt-1 text-sm text-neutral-500">
                {loading ? "Loading…" : `${companies.length} compan${companies.length !== 1 ? "ies" : "y"} available`}
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
                <div key={i} className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"/>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
              <svg className="mx-auto h-10 w-10 text-neutral-300" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <p className="mt-3 text-sm font-semibold text-neutral-500">No companies found</p>
              <p className="mt-1 text-xs text-neutral-400">Create your first company using the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((c) => {
                const isActive = activeId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm transition ${
                      isActive ? "border-[#0b1f3a] ring-1 ring-[#0b1f3a]/10" : "border-neutral-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                        isActive ? "bg-[#0b1f3a] text-white" : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{c.name}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {c.email ?? "—"}{c.phone ? ` · ${c.phone}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onSelect(c.id)}
                      disabled={submitting || isActive}
                      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#0b1f3a] text-white cursor-default"
                          : "border border-neutral-200 bg-white text-neutral-700 hover:border-[#0b1f3a] hover:text-[#0b1f3a]"
                      }`}
                    >
                      {isActive ? "✓ Active" : "Select"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Create Company
        ══════════════════════════════════════════ */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Admin</p>
            <h2 className="mt-1 text-base font-semibold text-neutral-900">Create company</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Requires admin role.</p>
          </div>

          <form onSubmit={onCreate} className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Company Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nuqoosh LLC"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Email (optional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="company@example.com"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>
            <button
              type="submit"
              disabled={!canCreate}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] text-sm font-semibold text-white hover:bg-[#0d2444] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Creating…
                </>
              ) : "Create company"}
            </button>
          </form>
        </div>

      </div>
    </AppShell>
  );
}