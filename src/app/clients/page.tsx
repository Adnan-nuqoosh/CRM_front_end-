"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Client } from "@/lib/crmApi";

export default function ClientsPage() {
  // ── List state ───────────────────────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  // ── Create-client form state ────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState<string | null>(null);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");

  const canCreate = useMemo(() => name.trim().length > 1 && !submitting, [name, submitting]);

  // Client list filtered by the search box (matches name, email, or phone).
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search),
  );

  /** Fetches the client list for the active company. */
  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const data = await crmApi.clients.list();
      setClients(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }

  // Load the client list once on mount.
  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canCreate) return;

    setSubmitting(true);
    setError(null);

    try {
      await crmApi.clients.create({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      // Reset the form after a successful create.
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");

      setSuccess("Client created successfully!");
      setTimeout(() => setSuccess(null), 3000);

      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create client.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Clients" subtitle="Manage customers inside the selected company.">

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

        {/* ══════════════════════════════════════════
            LEFT — Client List
        ══════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Client Directory</p>
              <p className="mt-1 text-sm text-neutral-500">
                {loading ? "Loading…" : `${clients.length} client${clients.length !== 1 ? "s" : ""} total`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-9 w-40 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none focus:border-[#0b1f3a] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"/>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
              <svg className="mx-auto h-10 w-10 text-neutral-300" viewBox="0 0 24 24" fill="none">
                <path d="M17 21a4 4 0 0 0-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p className="mt-3 text-sm font-semibold text-neutral-500">
                {search ? "No clients match your search" : "No clients yet"}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {search ? "Try a different search term." : "Add your first client using the form."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    <th className="border-b border-neutral-200 px-5 py-3">Name</th>
                    <th className="border-b border-neutral-200 px-5 py-3">Email</th>
                    <th className="border-b border-neutral-200 px-5 py-3">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="border-b border-neutral-100 px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0b1f3a]/10 text-xs font-bold text-[#0b1f3a]">
                            {c.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-neutral-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="border-b border-neutral-100 px-5 py-3.5 text-sm text-neutral-500">{c.email ?? "—"}</td>
                      <td className="border-b border-neutral-100 px-5 py-3.5 text-sm text-neutral-500">{c.phone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Add Client
        ══════════════════════════════════════════ */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">New Client</p>
            <h2 className="mt-1 text-base font-semibold text-neutral-900">Add customer</h2>
          </div>

          <form onSubmit={onCreate} className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client full name"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Client address"
                rows={2}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
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
                  Saving…
                </>
              ) : "Create client"}
            </button>
          </form>
        </div>

      </div>
    </AppShell>
  );
}