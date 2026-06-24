"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Company } from "@/lib/crmApi";
import { getActiveCompanyId } from "@/lib/auth";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/** Small metric card used in the stats row (Companies / Clients / Templates / Documents). */
function StatCard(props: { label: string; value: string; helper?: string }) {
  return (
    <div className="border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-neutral-500">{props.label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">{props.value}</p>
      {props.helper ? <p className="mt-2 text-xs font-medium text-neutral-500">{props.helper}</p> : null}
    </div>
  );
}

/** Heading row with an optional subtitle and a right-aligned action (e.g. a button). */
function SectionTitle(props: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{props.title}</h2>
        {props.subtitle ? <p className="mt-1 text-sm text-neutral-600">{props.subtitle}</p> : null}
      </div>
      {props.action ? <div className="shrink-0">{props.action}</div> : null}
    </div>
  );
}

/** Clickable shortcut card used in the "Getting started" grid. */
function ActionLink(props: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={props.href}
      className="block border border-neutral-200 bg-white px-4 py-4 hover:bg-neutral-50 active:bg-neutral-100"
    >
      <p className="text-sm font-semibold text-neutral-900">{props.title}</p>
      <p className="mt-1 text-sm text-neutral-600">{props.desc}</p>
    </Link>
  );
}

// Shape of the analytics payload returned by GET /api/analytics.
type AnalyticsData = {
  revenue_by_month: { month: string; revenue: number }[];
  top_clients: { client_name: string; document_count: number; total_amount: number }[];
  documents_by_month: { month: string; count: number }[];
};

export default function DashboardPage() {
  const [name, setName]             = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>("—");

  const [companies, setCompanies]                 = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(null);
  const [counts, setCounts]                       = useState<{ clients: number; templates: number; documents: number } | null>(null);
  const [analytics, setAnalytics]                 = useState<AnalyticsData | null>(null);
  const [loadError, setLoadError]                 = useState<string | null>(null);

  // Read the cached user name for the greeting. Display-only — AppShell
  // handles the actual auth check/redirect, so this never blocks rendering.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("nuqoosh.user") ?? window.sessionStorage.getItem("nuqoosh.user");
      if (!raw) return;
      const u = JSON.parse(raw) as { name?: string };
      setName(typeof u.name === "string" ? u.name : null);
    } catch {
      // Ignore malformed/missing cached user — greeting just falls back to generic text.
    }
  }, []);

  // Format today's date for the header (e.g. "Monday, Jun 22, 2026").
  useEffect(() => {
    const d = new Date();
    const formatted = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
    setTodayLabel(formatted);
  }, []);

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === activeCompanyId) ?? null,
    [activeCompanyId, companies],
  );

  // Load companies + (if a company is active) counts and analytics.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      try {
        const res = await crmApi.companies.list();
        if (cancelled) return;

        setCompanies(res.companies ?? []);
        const stored = getActiveCompanyId();
        setActiveCompanyIdState(stored);

        // Counts + analytics require an active company — skip if none is set.
        if (!stored) {
          setCounts(null);
          setAnalytics(null);
          return;
        }

        const [clients, templates, documents, analyticsData] = await Promise.all([
          crmApi.clients.list(),
          crmApi.templates.list(),
          crmApi.documents.list(),
          crmApi.analytics.get(),
        ]);
        if (cancelled) return;

        setCounts({
          clients: clients?.length ?? 0,
          templates: templates?.length ?? 0,
          documents: documents?.length ?? 0,
        });
        setAnalytics(analyticsData);
      } catch (e: unknown) {
        if (cancelled) return;
        setCounts(null);
        setAnalytics(null);
        setLoadError(
          e && typeof e === "object" && "message" in e && typeof e.message === "string"
            ? e.message
            : "Failed to load dashboard.",
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Total revenue across the loaded 6-month window, for the chart card subtitle.
  const totalRevenue = useMemo(() => {
    if (!analytics) return 0;
    return analytics.revenue_by_month.reduce((sum, m) => sum + m.revenue, 0);
  }, [analytics]);

  return (
    <AppShell title="Dashboard" subtitle="Your CRM workspace at a glance.">
      {loadError ? (
        <div className="mb-6 border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-neutral-900">{loadError}</div>
      ) : null}

      {/* ── Welcome banner ── */}
      <div className="mb-8 border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-neutral-500">{todayLabel}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
              {name ? `Welcome back, ${name}.` : "Welcome back."}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {activeCompany
                ? `Active company: ${activeCompany.name}`
                : "No active company selected yet. Select a company to unlock clients, templates, and documents."}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/companies"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0b1f3a] px-5 text-sm font-semibold text-white hover:bg-[#091a31] active:bg-[#071429]"
            >
              {activeCompany ? "Change company" : "Select company"}
            </Link>
            <Link
              href="/documents"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0b1f3a] px-5 text-sm font-semibold text-white hover:bg-[#091a31] active:bg-[#071429]"
            >
              Generate document
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Companies" value={String(companies.length)} helper="Workspaces you can access" />
        <StatCard
          label="Clients"
          value={counts ? String(counts.clients) : "—"}
          helper={activeCompany ? "In active company" : "Select a company"}
        />
        <StatCard
          label="Templates"
          value={counts ? String(counts.templates) : "—"}
          helper={activeCompany ? "Ready to generate documents" : "Select a company"}
        />
        <StatCard
          label="Documents"
          value={counts ? String(counts.documents) : "—"}
          helper={activeCompany ? "Generated PDFs" : "Select a company"}
        />
      </div>

      {/* ── Analytics charts ── */}
      {activeCompany && analytics ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Revenue by month */}
          <div className="border border-neutral-200 bg-white p-6 shadow-sm">
            <SectionTitle
              title="Revenue (last 6 months)"
              subtitle={`Total: AED ${totalRevenue.toLocaleString()}`}
            />
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.revenue_by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip formatter={(value: number) => [`AED ${value.toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#0b1f3a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Documents generated by month */}
          <div className="border border-neutral-200 bg-white p-6 shadow-sm">
            <SectionTitle
              title="Documents generated (last 6 months)"
              subtitle="Number of contracts/NDAs created per month."
            />
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.documents_by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} stroke="#9ca3af" />
                  <Tooltip formatter={(value: number) => [value, "Documents"]} />
                  <Bar dataKey="count" fill="#0b1f3a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top clients */}
          <div className="border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <SectionTitle title="Top clients" subtitle="Ranked by number of documents generated." />
            {analytics.top_clients.length === 0 ? (
              <p className="mt-5 text-sm text-neutral-500">No documents generated yet for this company.</p>
            ) : (
              <div className="mt-5 overflow-hidden border border-neutral-200">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      <th className="border-b border-neutral-200 px-5 py-3">Client</th>
                      <th className="border-b border-neutral-200 px-5 py-3">Documents</th>
                      <th className="border-b border-neutral-200 px-5 py-3">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_clients.map((c, i) => (
                      <tr key={c.client_name + i} className="hover:bg-neutral-50">
                        <td className="border-b border-neutral-100 px-5 py-3.5 text-sm font-semibold text-neutral-900">
                          {c.client_name}
                        </td>
                        <td className="border-b border-neutral-100 px-5 py-3.5 text-sm text-neutral-700">
                          {c.document_count}
                        </td>
                        <td className="border-b border-neutral-100 px-5 py-3.5 text-sm text-neutral-700">
                          AED {c.total_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : null}

      {/* ── Shortcuts + status ── */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-neutral-200 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Getting started"
            subtitle="Use these shortcuts to work faster."
            action={
              <Link
                href="/documents"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0b1f3a] px-4 text-sm font-semibold text-white hover:bg-[#091a31] active:bg-[#071429]"
              >
                Generate PDF
              </Link>
            }
          />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ActionLink href="/companies" title="Select company" desc="Choose the active company for CRM access." />
            <ActionLink href="/clients" title="Add client" desc="Create a customer inside the active company." />
            <ActionLink href="/document-templates" title="Create template" desc="Add reusable templates for documents." />
            <ActionLink href="/documents" title="Generate document" desc="Pick client + template and download PDF." />
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-neutral-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Active company" subtitle="Current workspace selection." />
            <div className="mt-5 border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-neutral-500">STATUS</p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">
                {activeCompany ? activeCompany.name : "Not selected"}
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {activeCompany
                  ? "You can access clients, templates, and documents."
                  : "Go to Companies and select a company to unlock CRM modules."}
              </p>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white p-6 shadow-sm">
            <SectionTitle title="What's available" subtitle="Modules implemented in this CRM." />
            <ul className="mt-5 space-y-2 text-sm text-neutral-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-accent-400" />
                Companies: list, create (admin), select active company
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-accent-400" />
                Clients: list + create (delete route exists but backend controller still needs `destroy()`)
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-accent-400" />
                Templates: list + create (admin)
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-accent-400" />
                Documents: list + generate + download PDF
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 bg-accent-400" />
                Analytics: revenue, document trends, and top clients
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}