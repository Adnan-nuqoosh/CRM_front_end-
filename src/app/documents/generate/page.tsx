"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type DocumentTemplate, type Client } from "@/lib/crmApi";
import { getActiveCompanyId } from "@/lib/auth";

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

const inputClass =
  "h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10";

export default function GenerateContractPage() {
  const router = useRouter();

  // ── Page data ────────────────────────────────────────────────────────────
  const [clients, setClients]       = useState<Client[]>([]);
  const [templates, setTemplates]   = useState<DocumentTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Form fields ──────────────────────────────────────────────────────────
  const [clientId, setClientId]           = useState<number | null>(null);
  const [templateId, setTemplateId]       = useState<number | null>(null);
  const [category, setCategory]           = useState("");
  const [subCategory, setSubCategory]     = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [contractDate, setContractDate]   = useState("");
  const [deliveryDate, setDeliveryDate]   = useState("");
  const [amount, setAmount]               = useState("");
  const [language, setLanguage]           = useState<"en" | "ar">("en");

  // Lower-cased name of the company currently active for this user.
  // Used to gate company-specific categories (e.g. MNDA is VMC-only).
  const [activeCompanyName, setActiveCompanyName] = useState("");

  // Templates narrowed down to the selected category/sub-category.
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (category && t.category !== category) return false;
      if (subCategory && t.sub_category !== subCategory) return false;
      return true;
    });
  }, [templates, category, subCategory]);

  const canGenerate = useMemo(
    () => clientId !== null && templateId !== null && amount.trim().length > 0 && !submitting,
    [clientId, templateId, amount, submitting],
  );

  // Load clients + templates once on mount.
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cls, tpls] = await Promise.all([
          crmApi.clients.list(),
          crmApi.templates.list(),
        ]);
        setClients(cls);
        setTemplates(tpls);
        if (cls.length > 0) setClientId(cls[0].id);
        setContractDate(new Date().toISOString().split("T")[0]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load form data.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // Auto-select the template if exactly one matches the chosen category/sub-category.
  useEffect(() => {
    if (filteredTemplates.length === 1) {
      setTemplateId(filteredTemplates[0].id);
    } else {
      setTemplateId(null);
    }
  }, [filteredTemplates]);

  // Resolve the active company's name once on mount, so we know whether to
  // show company-specific categories (e.g. MNDA for VMC).
  useEffect(() => {
    async function loadCompanyName() {
      try {
        const companyId = getActiveCompanyId();
        const res = await crmApi.companies.list();
        const companies = res.companies ?? [];
        const active = companies.find((c: any) => c.id === companyId);
        setActiveCompanyName(active?.name?.toLowerCase() ?? "");
      } catch {
        setActiveCompanyName("");
      }
    }
    void loadCompanyName();
  }, []);

  async function onGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canGenerate || clientId === null || templateId === null) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await crmApi.documents.generate({
        client_id:      clientId,
        template_id:    templateId,
        price:          amount,
        amount,
        client_address: clientAddress,
        contract_date:  contractDate,
        delivery_date:  deliveryDate,
      });

      // Auto-download the generated PDF.
      if (res.document?.id) {
        const blob = await crmApi.documents.download(res.document.id);
        downloadBlob(blob, `${res.document.contract_number ?? "document_" + res.document.id}.pdf`);
      }

      router.push("/documents");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate document.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Generate Contract" subtitle="Fill in the details to generate a PDF contract.">

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Back link */}
      <div className="mb-6">
        <Link href="/documents" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-[#0b1f3a]">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0 7 7m-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Documents
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"/>
          ))}
        </div>
      ) : (
        <form onSubmit={onGenerate}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

            {/* LEFT: Main form */}
            <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-900">Contract Details</h2>

                {/* Language Toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                      language === "en"
                        ? "bg-[#0b1f3a] text-white border-[#0b1f3a]"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0b1f3a]"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("ar")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                      language === "ar"
                        ? "bg-[#0b1f3a] text-white border-[#0b1f3a]"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0b1f3a]"
                    }`}
                  >
                    عربي
                  </button>
                </div>
              </div>

              {/* Row 1: Client + Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Client *</label>
                  <select
                    value={clientId ?? ""}
                    onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
                    className={inputClass}
                  >
                    <option value="">Select client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setSubCategory(""); setTemplateId(null); }}
                    className={inputClass}
                  >
                    <option value="">Select category…</option>
                    <option value="NDA">NDA</option>
                    {/* MNDA is only relevant to VMC; hidden for every other company. */}
                    {activeCompanyName === "vmc" && <option value="MNDA">MNDA</option>}
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              {/* Sub Category */}
              {category === "Contract" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Sub Category</label>
                  <div className="flex flex-wrap gap-2">
                    {["Website Only", "Website + Branding", "Branding Only"].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubCategory(sub === subCategory ? "" : sub)}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          subCategory === sub
                            ? "border-[#0b1f3a] bg-[#0b1f3a] text-white"
                            : "border-neutral-200 bg-white text-neutral-600 hover:border-[#0b1f3a] hover:text-[#0b1f3a]"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Template */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Template *</label>
                {filteredTemplates.length === 0 ? (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-400">
                    {category ? "No templates found for selected category." : "Select a category first."}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplateId(t.id === templateId ? null : t.id)}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          templateId === t.id
                            ? "border-[#0b1f3a] bg-[#0b1f3a] text-white"
                            : "border-neutral-200 bg-white text-neutral-600 hover:border-[#0b1f3a] hover:text-[#0b1f3a]"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Client Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Client Address</label>
                <textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="e.g. Dubai, UAE"
                  rows={2}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Contract Date</label>
                  <input
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: Summary + Generate */}
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-900">Payment</h2>
                <div className="mt-4 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Amount *</label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. AED 5,000"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Summary card */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Summary</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Client</span>
                    <span className="font-semibold text-neutral-800">
                      {clients.find((c) => c.id === clientId)?.name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Category</span>
                    <span className="font-semibold text-neutral-800">{category || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Template</span>
                    <span className="font-semibold text-neutral-800">
                      {templates.find((t) => t.id === templateId)?.name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Amount</span>
                    <span className="font-semibold text-neutral-800">{amount || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Language</span>
                    <span className="font-semibold text-neutral-800">{language === "ar" ? "عربي" : "English"}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canGenerate}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b1f3a] text-sm font-semibold text-white hover:bg-[#0d2444] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M12 15V3m0 12-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Generate & Download PDF
                  </>
                )}
              </button>

              <p className="text-center text-xs text-neutral-400">
                PDF will auto-download after generation.
              </p>
            </div>

          </div>
        </form>
      )}
    </AppShell>
  );
}