"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Client } from "@/lib/crmApi";
import { hasPermission } from "@/lib/auth";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_number: string;
  status: "active" | "inactive" | "lead";
  source: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "", email: "", phone: "", address: "", tax_number: "",
  status: "active", source: "", notes: "",
};

function fieldClass() {
  return "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [permissions, setPermissions] = useState({ create: false, edit: false, archive: false });

  useEffect(() => {
    setPermissions({
      create: hasPermission("clients.create"),
      edit: hasPermission("clients.edit"),
      archive: hasPermission("clients.archive"),
    });
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.phone, client.tax_number, client.source]
        .some((value) => (value ?? "").toLowerCase().includes(needle)),
    );
  }, [clients, search]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setClients(await crmApi.clients.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  function beginEdit(client: Client) {
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: client.address ?? "",
      tax_number: client.tax_number ?? "",
      status: client.status === "inactive" || client.status === "lead" ? client.status : "active",
      source: client.source ?? "",
      notes: client.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function saveClient(event: React.FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        tax_number: form.tax_number.trim() || undefined,
        source: form.source.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editing) {
        await crmApi.clients.update(editing.id, body);
        setNotice("Client profile updated successfully.");
      } else {
        await crmApi.clients.create(body);
        setNotice("Client created successfully.");
      }
      resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save client.");
    } finally {
      setSubmitting(false);
      window.setTimeout(() => setNotice(null), 3500);
    }
  }

  async function archiveClient(client: Client) {
    if (!window.confirm(`Archive ${client.name}? Existing documents will remain available.`)) return;
    setError(null);
    try {
      await crmApi.clients.archive(client.id);
      setNotice("Client archived successfully.");
      if (editing?.id === client.id) resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to archive client.");
    }
  }

  const showForm = permissions.create || (permissions.edit && editing);

  return (
    <AppShell title="Clients" subtitle="A complete, company-isolated client directory with document history.">
      {(error || notice) && (
        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ?? notice}
        </div>
      )}

      <div className={`grid gap-6 ${showForm ? "xl:grid-cols-[minmax(0,1fr)_390px]" : ""}`}>
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_55px_-35px_rgba(15,23,42,.45)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Client directory</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">{clients.length} active records</h2>
            </div>
            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 sm:w-60" />
              <button onClick={() => void refresh()} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">{[1,2,3,4].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">◎</div>
              <p className="mt-4 font-semibold text-slate-700">No clients found</p>
              <p className="mt-1 text-sm text-slate-400">Create a client or change the search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                  <tr><th className="px-5 py-3">Client</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Documents</th><th className="px-5 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((client) => (
                    <tr key={client.id} className="group hover:bg-blue-50/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-blue-700 text-sm font-bold text-white">{client.name.slice(0,1).toUpperCase()}</div>
                          <div><p className="font-semibold text-slate-900">{client.name}</p><p className="mt-0.5 text-xs text-slate-400">{client.source || "Direct client"}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><p className="text-sm text-slate-700">{client.email || "—"}</p><p className="mt-1 text-xs text-slate-400">{client.phone || "No phone"}</p></td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${client.status === "lead" ? "bg-amber-100 text-amber-700" : client.status === "inactive" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>{client.status || "active"}</span></td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{client.documents_count ?? 0}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2">
                        {permissions.edit && <button onClick={() => beginEdit(client)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">Edit</button>}
                        {permissions.archive && <button onClick={() => void archiveClient(client)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Archive</button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showForm && (
          <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_-35px_rgba(15,23,42,.45)] xl:sticky xl:top-36">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">{editing ? "Edit record" : "New record"}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{editing ? editing.name : "Add client"}</h2></div>
              {editing && <button onClick={resetForm} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Cancel</button>}
            </div>
            <form onSubmit={saveClient} className="space-y-3.5">
              <input className={fieldClass()} placeholder="Client or business name *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3"><input className={fieldClass()} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /><input className={fieldClass()} placeholder="Phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
              <input className={fieldClass()} placeholder="Tax / VAT number" value={form.tax_number} onChange={(e) => setForm({...form, tax_number: e.target.value})} />
              <div className="grid grid-cols-2 gap-3"><select className={fieldClass()} value={form.status} onChange={(e) => setForm({...form, status: e.target.value as FormState["status"]})}><option value="active">Active</option><option value="lead">Lead</option><option value="inactive">Inactive</option></select><input className={fieldClass()} placeholder="Source" value={form.source} onChange={(e) => setForm({...form, source: e.target.value})} /></div>
              <textarea className="min-h-20 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
              <textarea className="min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" placeholder="Internal notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              <button disabled={submitting || form.name.trim().length < 2} className="h-11 w-full rounded-xl bg-gradient-to-r from-slate-950 to-blue-800 text-sm font-bold text-white shadow-lg shadow-blue-900/15 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Saving..." : editing ? "Save changes" : "Create client"}</button>
            </form>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
