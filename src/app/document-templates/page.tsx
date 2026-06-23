"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type DocumentTemplate } from "@/lib/crmApi";
import { getActiveCompanyId } from "@/lib/auth";

// ════════════════════════════════════════════════════════════════════════════
// STARTER TEMPLATES
// Pre-filled HTML content that auto-loads into the textarea when a category
// (and sub-category, where applicable) is selected in the "Create template"
// form. Keys must match the <option> values in the Category/Sub Category
// selects further down this file.
// ════════════════════════════════════════════════════════════════════════════
const STARTER_TEMPLATES: Record<string, Record<string, string>> = {
  // ── NDA (Non-Disclosure Agreement) ─────────────────────────────────────
  NDA: {
    default: `<div class="section-title">1. Introduction</div>
<p>This Non-Disclosure Agreement is entered into on <strong>{{contract_date}}</strong> between <strong>{{company_name}}</strong> ("Disclosing Party") and <strong>{{client_name}}</strong> of <strong>{{client_address}}</strong> ("Receiving Party").</p>

<div class="section-title">2. Confidential Information</div>
<p>Confidential Information includes business plans, financial data, client lists, marketing strategies, and any information designated as confidential.</p>

<div class="section-title">3. Obligations</div>
<ul>
  <li>Hold all Confidential Information in strict confidence.</li>
  <li>Not disclose to any third party without prior written consent.</li>
  <li>Use solely for evaluating the potential business relationship.</li>
</ul>

<div class="section-title">4. Duration</div>
<p>This Agreement remains effective for <strong>two (2) years</strong> from the date of signing.</p>

<div class="section-title">5. Governing Law</div>
<p>This Agreement is governed by applicable laws.</p>`,
  },

  // ── MNDA (Mutual Non-Disclosure Agreement) — VMC only ──────────────────
  MNDA: {
    default: `<p style="text-align:center; font-weight:bold;">MUTUAL NON-DISCLOSURE AGREEMENT (MNDA)</p>
<p style="text-align:center;">REF. NUMBER: <strong>{{contract_number}}</strong> &nbsp; Date: <strong>{{contract_date}}</strong></p>

<p>This Mutual Non-Disclosure Agreement (the "Agreement") is entered into on the above date by and between:</p>

<div class="section-title">PARTIES</div>
<p><strong>First Party:</strong><br/>
Vault Management Consultants (VMC), a Sole Establishment duly licensed under the Dubai Department of Economy &amp; Tourism (License No. 733853), having its principal office at Premises No. 218, Ali Rashed Lootah Buildings, Al Rigga, Deira, Dubai, UAE, represented by its Owner, Sultan Ali Rashed Lootah ("First Party").</p>
<p><strong>Second Party:</strong><br/>
<strong>{{client_name}}</strong>, of <strong>{{client_address}}</strong> ("Second Party").</p>
<p>Each a "Party" and together the "Parties."</p>

<div class="section-title">BACKGROUND</div>
<p>This Agreement is mutual. Each Party possesses confidential, proprietary, strategic, technical, financial, and operational information. In consideration of exchanging such information for the evaluation, negotiation, and potential consummation of a business relationship relating to distributor onboarding and export business ("Specified Purpose"), the Parties agree to protect such information under the terms of this Agreement.</p>

<div class="section-title">1. DEFINITIONS</div>
<p><strong>1.1 Confidential Information</strong><br/>
"Confidential Information" means all information disclosed by either Party to the other, whether written, oral, digital, or otherwise, including business plans, financial statements, projections, feasibility studies, trade secrets, operational processes, reports, data, customer lists, supplier information, pricing, proposals, and materials derived therefrom.</p>
<p><strong>1.2 Representatives</strong><br/>
"Representatives" means directors, officers, employees, advisers, consultants, or contractors who need to know the Confidential Information for the Specified Purpose and are bound by confidentiality obligations.</p>
<p><strong>1.3 Trade Secrets</strong><br/>
"Trade Secrets" means information that derives economic value from not being generally known and is subject to reasonable efforts to maintain secrecy.</p>

<div class="section-title">2. USE OF CONFIDENTIAL INFORMATION</div>
<p><strong>2.1 Purpose Limitation</strong><br/>
Each Party shall use the other Party's Confidential Information solely for the Specified Purpose.</p>
<p><strong>2.2 No Reverse Engineering</strong><br/>
Neither Party shall reverse engineer, copy, or replicate any confidential commercial models, materials, or methodologies of the other Party.</p>

<div class="section-title">3. CONFIDENTIALITY OBLIGATIONS</div>
<p><strong>3.1 Standard of Care</strong><br/>
Each Party shall safeguard the other Party's Confidential Information with reasonable care.</p>
<p><strong>3.2 Need-to-Know Access</strong><br/>
Disclosure shall be limited strictly to Representatives with a legitimate need to know.</p>
<p><strong>3.3 Notification of Breach</strong><br/>
Each Party shall promptly notify the other of any unauthorized disclosure or suspected breach.</p>

<div class="section-title">4. DISCLOSURE TO THIRD PARTIES</div>
<p>Neither Party shall disclose the other Party's Confidential Information to any third party without prior written consent, except as expressly permitted herein.</p>

<div class="section-title">5. COMPELLED DISCLOSURE</div>
<p>If disclosure is required by law or regulatory authority, the receiving Party shall provide prior written notice to the disclosing Party where legally permissible.</p>

<div class="section-title">6. EXCLUSIONS</div>
<p>Confidentiality obligations shall not apply to information that:</p>
<ul>
  <li>becomes public without breach of this Agreement,</li>
  <li>is independently developed without reference to Confidential Information, or</li>
  <li>is rightfully received from a third party without restriction.</li>
</ul>

<div class="section-title">7. RETURN AND DESTRUCTION</div>
<p>Upon request or completion of the Specified Purpose, each Party shall return or destroy all Confidential Information belonging to the other Party.</p>

<div class="section-title">8. OWNERSHIP; NO LICENSE</div>
<p>All Confidential Information remains the exclusive property of the disclosing Party. No license or rights are granted except as expressly stated.</p>

<div class="section-title">9. NON-CIRCUMVENTION</div>
<p>For twenty-four (24) months, neither Party shall bypass, engage, or transact directly with distributors, partners, or business opportunities introduced by the other Party without written consent.</p>

<div class="section-title">10. DATA PROTECTION AND COMPLIANCE</div>
<p>Each Party shall comply with applicable data protection, privacy, and export control laws.</p>

<div class="section-title">11. DISCLAIMER</div>
<p>Confidential Information is provided "as is" without warranties of accuracy or completeness.</p>

<div class="section-title">12. REMEDIES</div>
<p>Each Party retains all rights and remedies available under applicable law. No fixed monetary penalties or liquidated damages apply unless mutually agreed in writing.</p>

<div class="section-title">13. LIMITATION OF LIABILITY</div>
<p>Neither Party shall be liable for indirect, incidental, or consequential damages arising from this Agreement.</p>

<div class="section-title">14. TERM AND SURVIVAL</div>
<p>This Agreement remains effective for two (2) years from the date above. Confidentiality obligations survive for two (2) years after termination or expiration.</p>

<div class="section-title">15. NOTICES</div>
<p>Notices shall be delivered in writing to the addresses of the Parties as stated above or as updated in writing.</p>

<div class="section-title">16. GOVERNING LAW AND JURISDICTION</div>
<p>This Agreement shall be governed by the laws of the Emirate of Dubai and applicable UAE federal laws. Courts of Dubai shall have exclusive jurisdiction.</p>

<div class="section-title">17. ENTIRE AGREEMENT</div>
<p>This Agreement constitutes the entire understanding between the Parties regarding confidentiality and supersedes all prior discussions.</p>

<div class="section-title">18. AMENDMENTS</div>
<p>Any amendments must be in writing and signed by both Parties.</p>

<div class="section-title">19. SEVERABILITY</div>
<p>If any provision is held invalid, the remaining provisions shall remain in full force.</p>

<div class="section-title">20. EXECUTION</div>
<p>IN WITNESS WHEREOF, the Parties have executed this Mutual Non-Disclosure Agreement.</p>`,
  },

  // ── Contract (sub-categories: Website Only / Website + Branding / Branding Only) ──
  Contract: {
    "Website Only": `<div class="section-title">1. Project Overview</div>
<p>This Agreement is entered into on <strong>{{contract_date}}</strong> between <strong>{{company_name}}</strong> ("Agency") and <strong>{{client_name}}</strong> of <strong>{{client_address}}</strong> ("Client").</p>

<div class="section-title">2. Scope of Work</div>
<ul>
  <li>Custom website design — up to 5 pages.</li>
  <li>Fully responsive design (mobile, tablet, desktop).</li>
  <li>SEO-friendly structure and meta tag optimization.</li>
  <li>Contact forms and social media integration.</li>
</ul>

<div class="section-title">3. Payment Terms</div>
<p>Total project value: <strong>{{amount}}</strong></p>
<ul>
  <li><strong>50%</strong> — Advance upon signing.</li>
  <li><strong>50%</strong> — Upon delivery.</li>
</ul>

<div class="section-title">4. Timeline</div>
<p>Estimated delivery: <strong>{{delivery_date}}</strong>.</p>

<div class="section-title">5. Revisions</div>
<p>Includes <strong>3 rounds</strong> of revisions.</p>

<div class="section-title">6. Ownership</div>
<p>Full ownership transfers to Client upon receipt of final payment.</p>`,

    "Website + Branding": `<div class="section-title">1. Project Overview</div>
<p>This Agreement, dated <strong>{{contract_date}}</strong>, is between <strong>{{company_name}}</strong> ("Agency") and <strong>{{client_name}}</strong> ("Client") for a complete Website and Brand Identity package.</p>

<div class="section-title">2. Branding Scope</div>
<ul>
  <li>Logo design — up to 3 concepts with revisions.</li>
  <li>Brand color palette and typography.</li>
  <li>Business card and letterhead design.</li>
  <li>Brand guidelines document (PDF).</li>
</ul>

<div class="section-title">3. Website Scope</div>
<ul>
  <li>Custom website — up to 7 pages.</li>
  <li>Responsive layout, SEO-optimized.</li>
  <li>Brand-consistent design using approved assets.</li>
</ul>

<div class="section-title">4. Payment Terms</div>
<p>Total: <strong>{{amount}}</strong> — 50% advance, 25% on brand approval, 25% on launch.</p>

<div class="section-title">5. Timeline</div>
<p>Estimated delivery: <strong>{{delivery_date}}</strong>.</p>`,

    "Branding Only": `<div class="section-title">1. Project Overview</div>
<p>This Branding Agreement is made on <strong>{{contract_date}}</strong> between <strong>{{company_name}}</strong> ("Agency") and <strong>{{client_name}}</strong> ("Client").</p>

<div class="section-title">2. Deliverables</div>
<ul>
  <li>Logo design — 3 concepts, final in PNG/SVG/PDF.</li>
  <li>Brand color palette with HEX, RGB, CMYK codes.</li>
  <li>Typography selection and usage guide.</li>
  <li>Business card design (front and back).</li>
  <li>Letterhead design (A4).</li>
  <li>Brand guidelines document (PDF).</li>
</ul>

<div class="section-title">3. Payment Terms</div>
<p>Total: <strong>{{amount}}</strong> — 50% advance, 50% on delivery.</p>

<div class="section-title">4. Timeline</div>
<p>Initial concepts within 7 business days. Full delivery: <strong>{{delivery_date}}</strong>.</p>

<div class="section-title">5. Ownership</div>
<p>All files transfer to Client upon full payment.</p>`,

    default: `<div class="section-title">1. Parties</div>
<p>This Agreement is entered into on <strong>{{contract_date}}</strong> between <strong>{{company_name}}</strong> ("Service Provider") and <strong>{{client_name}}</strong> ("Client").</p>

<div class="section-title">2. Scope of Services</div>
<ul>
  <li>Service description here.</li>
  <li>Deliverables and timeline.</li>
</ul>

<div class="section-title">3. Payment</div>
<p>Total: <strong>{{amount}}</strong> — 50% advance, 50% on completion.</p>

<div class="section-title">4. Timeline</div>
<p>Delivery by: <strong>{{delivery_date}}</strong>.</p>`,
  },
};

// ── Variable buttons shown above the content textarea ──────────────────────
const PLACEHOLDERS = [
  { label: "Client Name",    value: "{{client_name}}" },
  { label: "Company Name",   value: "{{company_name}}" },
  { label: "Price",          value: "{{price}}" },
  { label: "Amount",         value: "{{amount}}" },
  { label: "Contract No.",   value: "{{contract_number}}" },
  { label: "Client Address", value: "{{client_address}}" },
  { label: "Contract Date",  value: "{{contract_date}}" },
  { label: "Delivery Date",  value: "{{delivery_date}}" },
];

// ── Badge colors for category / sub-category pills in the template list ───
const CATEGORY_COLORS: Record<string, string> = {
  NDA:      "bg-amber-50 text-amber-700 border border-amber-200",
  MNDA:     "bg-orange-50 text-orange-700 border border-orange-200",
  Contract: "bg-blue-50 text-blue-700 border border-blue-200",
};

const SUB_COLORS: Record<string, string> = {
  "Website Only":       "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Website + Branding": "bg-purple-50 text-purple-700 border border-purple-200",
  "Branding Only":      "bg-pink-50 text-pink-700 border border-pink-200",
};

/** Small rounded pill used to show category / sub-category on a template card. */
function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colorClass ?? "bg-neutral-100 text-neutral-600 border border-neutral-200"}`}>
      {label}
    </span>
  );
}

export default function DocumentTemplatesPage() {
  // ── Library state (left column) ─────────────────────────────────────────
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [error, setError]         = useState<string | null>(null);

  // ── Create-template form state (right column) ──────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [name, setName]             = useState("");
  const [type, setType]             = useState("invoice");
  const [content, setContent]       = useState("");
  const [category, setCategory]     = useState("");
  const [subCategory, setSubCategory] = useState("");

  // Lower-cased name of the company currently active for this user.
  // Used to gate company-specific categories (e.g. MNDA is VMC-only).
  const [activeCompanyName, setActiveCompanyName] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canCreate = useMemo(
    () => name.trim().length > 1 && type.trim().length > 0 && content.trim().length > 5 && !submitting,
    [content, name, submitting, type],
  );

  /** Loads the starter HTML for a given category/sub-category into the textarea. */
  function loadStarter(cat: string, sub: string) {
    const catMap = STARTER_TEMPLATES[cat];
    if (!catMap) {
      setContent("");
      return;
    }
    setContent(catMap[sub] ?? catMap["default"] ?? "");
  }

  function handleCategoryChange(val: string) {
    setCategory(val);
    setSubCategory("");
    loadStarter(val, "");
  }

  function handleSubCategoryChange(val: string) {
    setSubCategory(val);
    loadStarter(category, val);
  }

  /** Inserts a {{placeholder}} at the current cursor position in the textarea. */
  function insertPlaceholder(ph: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setContent((c) => c + ph);
      return;
    }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const next  = content.substring(0, start) + ph + content.substring(end);
    setContent(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + ph.length, start + ph.length);
    }, 0);
  }

  /** Fetches the template library for the active company. */
  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const res = await crmApi.templates.list();
      setTemplates(res ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }

  // Load the template library once on mount.
  useEffect(() => {
    void refresh();
  }, []);

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

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canCreate) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await crmApi.templates.create({
        name: name.trim(),
        type: type.trim(),
        category,
        sub_category: subCategory,
        content,
      });

      // Reset the form after a successful create.
      setName("");
      setCategory("");
      setSubCategory("");
      setContent("");
      setType("invoice");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);

      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Templates" subtitle="Manage reusable document templates for the active company.">

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
          <p className="text-sm font-medium text-emerald-700">Template created successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">

        {/* ══════════════════════════════════════════
            LEFT — Template Library
        ══════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Header card */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Library</p>
              <p className="mt-1 text-sm text-neutral-500">
                {loading ? "Loading…" : `${templates.length} template${templates.length !== 1 ? "s" : ""} in active company`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>

          {/* Template list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
              <svg className="mx-auto h-10 w-10 text-neutral-300" viewBox="0 0 24 24" fill="none">
                <path d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M14 3v4h4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="mt-3 text-sm font-semibold text-neutral-500">No templates yet</p>
              <p className="mt-1 text-xs text-neutral-400">Create your first template using the form on the right.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => {
                const isOpen = expanded === t.id;
                return (
                  <div key={t.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : t.id)}
                      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                          {t.category && (
                            <Badge label={t.category} colorClass={CATEGORY_COLORS[t.category]} />
                          )}
                          {t.sub_category && (
                            <Badge label={t.sub_category} colorClass={SUB_COLORS[t.sub_category]} />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-neutral-400">Type: {t.type} · ID {t.id}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <svg
                          className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          viewBox="0 0 24 24" fill="none"
                        >
                          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-neutral-100 px-5 pb-4 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Content Preview</p>
                        <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-lg border border-neutral-100 bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed text-neutral-600">
                          {t.content}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — Create Template
        ══════════════════════════════════════════ */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          {/* Form header */}
          <div className="border-b border-neutral-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Admin</p>
            <h2 className="mt-1 text-base font-semibold text-neutral-900">Create template</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Category select karo — content auto-load hoga.</p>
          </div>

          <form onSubmit={onCreate} className="space-y-5 px-6 py-5">

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              >
                <option value="">Select category…</option>
                <option value="NDA">NDA</option>
                {/* MNDA is only relevant to VMC; hidden for every other company. */}
                {activeCompanyName === "vmc" && <option value="MNDA">MNDA</option>}
                <option value="Contract">Contract</option>
              </select>
            </div>

            {/* Sub Category — only for Contract */}
            {category === "Contract" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Sub Category</label>
                <select
                  value={subCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
                >
                  <option value="">Select sub category…</option>
                  <option value="Website Only">Website Only</option>
                  <option value="Website + Branding">Website + Branding</option>
                  <option value="Branding Only">Branding Only</option>
                </select>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Template Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nuqoosh NDA 2026"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Type</label>
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="invoice"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-300 focus:border-[#0b1f3a] focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>

            {/* Placeholder inserter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Insert Variable
              </label>
              <p className="text-[11px] text-neutral-400">Content mein cursor rakh ke koi bhi button dabao.</p>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => insertPlaceholder(p.value)}
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 transition hover:border-[#0b1f3a] hover:bg-[#0b1f3a] hover:text-white"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Content (HTML)</label>
                {content && (
                  <span className="text-[11px] text-neutral-400">{content.length} chars</span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={11}
                placeholder={category ? "Content load ho raha hai…" : "Pehle category select karo…"}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-300 focus:border-[#0b1f3a] focus:bg-white focus:ring-1 focus:ring-[#0b1f3a]/10"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canCreate}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] text-sm font-semibold text-white transition hover:bg-[#0d2444] active:bg-[#091a31] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Create template
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </AppShell>
  );
}