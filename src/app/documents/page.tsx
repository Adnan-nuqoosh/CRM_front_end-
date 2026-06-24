"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Document, type DocumentTemplate, type Client } from "@/lib/crmApi";

/** Triggers a browser download for a Blob (used for the generated PDF). */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Badge colors for the Category column. Kept in sync with the colors used
// on the Templates page (document-templates/page.tsx).
const CATEGORY_COLORS: Record<string, string> = {
  NDA:      "bg-amber-50 text-amber-700 border border-amber-200",
  MNDA:     "bg-orange-50 text-orange-700 border border-orange-200",
  Contract: "bg-blue-50 text-blue-700 border border-blue-200",
};

export default function DocumentsPage() {
  const [documents, setDocuments]     = useState<Document[]>([]);
  const [clients, setClients]         = useState<Client[]>([]);
  const [templates, setTemplates]     = useState<DocumentTemplate[]>([]);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [error, setError]             = useState<string | null>(null);

  /** Loads documents plus the clients/templates needed to render their names. */
  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const [docs, cls, tpls] = await Promise.all([
        crmApi.documents.list(),
        crmApi.clients.list(),
        crmApi.templates.list(),
      ]);
      setDocuments(docs);
      setClients(cls);
      setTemplates(tpls);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }

  // Load the document list once on mount.
  useEffect(() => {
    void refresh();
  }, []);

  async function onDownload(doc: Document) {
    setDownloading(doc.id);
    setError(null);
    try {
      const blob = await crmApi.documents.download(doc.id);
      downloadBlob(blob, `${doc.contract_number ?? "document_" + doc.id}.pdf`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <AppShell title="Documents" subtitle="Generate and download contract PDFs.">

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Documents</p>
          <p className="mt-1 text-sm text-neutral-500">
            {loading ? "Loading…" : `${documents.length} document${documents.length !== 1 ? "s" : ""} generated`}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Link
            href="/documents/generate"
            className="flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0d2444]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Generate Contract
          </Link>
        </div>
      </div>

      {/* ── Document list ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"/>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white px-6 py-20 text-center">
          <svg className="mx-auto h-12 w-12 text-neutral-300" viewBox="0 0 24 24" fill="none">
            <path d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 3v4h4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="mt-4 text-sm font-semibold text-neutral-500">No documents yet</p>
          <p className="mt-1 text-xs text-neutral-400">Generate your first contract to see it here.</p>
          <Link
            href="/documents/generate"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d2444]"
          >
            Generate Contract
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <th className="border-b border-neutral-200 px-5 py-3">Contract No.</th>
                <th className="border-b border-neutral-200 px-5 py-3">Client</th>
                <th className="border-b border-neutral-200 px-5 py-3">Template</th>
                <th className="border-b border-neutral-200 px-5 py-3">Category</th>
                <th className="border-b border-neutral-200 px-5 py-3">Date</th>
                <th className="border-b border-neutral-200 px-5 py-3">PDF</th>
                <th className="border-b border-neutral-200 px-5 py-3"/>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => {
                const client = clients.find((c) => c.id === d.client_id);
                const tpl    = templates.find((t) => t.id === d.document_template_id);
                const isDownloading = downloading === d.id;
                return (
                  <tr key={d.id} className="hover:bg-neutral-50">
                    <td className="border-b border-neutral-100 px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-[#0b1f3a]">
                        {d.contract_number ?? `#${d.id}`}
                      </span>
                    </td>
                    <td className="border-b border-neutral-100 px-5 py-3.5 text-sm text-neutral-700">
                      {client?.name ?? `Client #${d.client_id}`}
                    </td>
                    <td className="border-b border-neutral-100 px-5 py-3.5 text-sm text-neutral-700">
                      {tpl?.name ?? `Template #${d.document_template_id}`}
                    </td>
                    <td className="border-b border-neutral-100 px-5 py-3.5">
                      {tpl?.category ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_COLORS[tpl.category] ?? "bg-neutral-100 text-neutral-600 border border-neutral-200"}`}>
                          {tpl.category}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="border-b border-neutral-100 px-5 py-3.5 text-xs text-neutral-400">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="border-b border-neutral-100 px-5 py-3.5">
                      {d.pdf_path ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="border-b border-neutral-100 px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => void onDownload(d)}
                        disabled={isDownloading || !d.pdf_path}
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-[#0b1f3a] hover:text-[#0b1f3a] disabled:opacity-40"
                      >
                        {isDownloading ? (
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15V3m0 12-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        )}
                        {isDownloading ? "Downloading…" : "Download"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}