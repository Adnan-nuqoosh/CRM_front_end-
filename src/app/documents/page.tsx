"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Document } from "@/lib/crmApi";
import { hasPermission } from "@/lib/auth";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [permissions, setPermissions] = useState({ generate: false, approve: false, archive: false });

  useEffect(() => {
    setPermissions({
      generate: hasPermission("documents.generate"),
      approve: hasPermission("documents.approve"),
      archive: hasPermission("documents.archive"),
    });
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setDocuments(await crmApi.documents.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Documents could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return documents.filter((document) => {
      if (status && document.status !== status) return false;
      if (!needle) return true;
      return [document.contract_number, document.client?.name, document.template?.name]
        .some((value) => (value ?? "").toLowerCase().includes(needle));
    });
  }, [documents, search, status]);

  async function run(id: number, action: () => Promise<unknown>, success: string) {
    setWorkingId(id);
    setError(null);
    try {
      await action();
      setNotice(success);
      await refresh();
      window.setTimeout(() => setNotice(null), 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setWorkingId(null);
    }
  }

  async function download(document: Document) {
    setWorkingId(document.id);
    try {
      const blob = await crmApi.documents.download(document.id);
      downloadBlob(blob, `${document.contract_number ?? `document-${document.id}`}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setWorkingId(null);
    }
  }

  const totalValue = documents.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const approved = documents.filter((item) => item.status === "approved").length;

  return (
    <AppShell title="Documents" subtitle="Generate, approve, download and archive company documents securely.">
      {(error || notice) && <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ?? notice}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Total documents", documents.length.toLocaleString(), "All generated records"],
          ["Approved", approved.toLocaleString(), `${documents.length ? Math.round((approved / documents.length) * 100) : 0}% approval rate`],
          ["Document value", totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }), "Active company total"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_-38px_rgba(15,23,42,.5)]">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{hint}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_22px_60px_-38px_rgba(15,23,42,.55)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contract, client or template..." className="h-11 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none"><option value="">All statuses</option><option value="generated">Generated</option><option value="approved">Approved</option></select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void refresh()} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Refresh</button>
            {permissions.generate && <Link href="/documents/generate" className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-slate-950 to-blue-800 px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/15">+ Generate document</Link>}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">{[1,2,3,4].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-24 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-2xl">▤</div><p className="mt-4 font-bold text-slate-700">No documents found</p><p className="mt-1 text-sm text-slate-400">Generate a document or change your filters.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400"><tr><th className="px-5 py-3">Document</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Value</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((document) => (
                  <tr key={document.id} className="hover:bg-blue-50/35">
                    <td className="px-5 py-4"><p className="font-bold text-slate-900">{document.contract_number ?? `DOC-${document.id}`}</p><p className="mt-1 text-xs text-slate-400">{document.template?.name ?? "Document template"}</p></td>
                    <td className="px-5 py-4"><p className="text-sm font-semibold text-slate-700">{document.client?.name ?? `Client #${document.client_id}`}</p><p className="mt-1 text-xs text-slate-400">Created by {document.creator?.name ?? "System"}</p></td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">{Number(document.amount ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${document.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{document.status ?? "generated"}</span></td>
                    <td className="px-5 py-4 text-sm text-slate-500">{document.created_at ? new Date(document.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2">
                      <button disabled={workingId === document.id} onClick={() => void download(document)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:opacity-40">Download</button>
                      {permissions.approve && document.status !== "approved" && <button disabled={workingId === document.id} onClick={() => void run(document.id, () => crmApi.documents.approve(document.id), "Document approved successfully.")} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Approve</button>}
                      {permissions.archive && <button disabled={workingId === document.id} onClick={() => window.confirm("Archive this document?") && void run(document.id, () => crmApi.documents.archive(document.id), "Document archived successfully.")} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Archive</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
