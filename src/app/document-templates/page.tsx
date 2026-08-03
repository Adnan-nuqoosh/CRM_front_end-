"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type DocumentTemplate } from "@/lib/crmApi";
import { getActiveCompanyId, hasPermission } from "@/lib/auth";

// ════════════════════════════════════════════════════════════════════════════
// STARTER TEMPLATES
// ════════════════════════════════════════════════════════════════════════════
const STARTER_TEMPLATES: Record<string, Record<string, string>> = {
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

function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colorClass ?? "bg-neutral-100 text-neutral-600 border border-neutral-200"}`}>
      {label}
    </span>
  );
}

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("contract");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [activeCompanyName, setActiveCompanyName] = useState("");
  const [canCreateTemplate, setCanCreateTemplate] = useState(false);
  const [canEditTemplate, setCanEditTemplate] = useState(false);
  const [canDuplicateTemplate, setCanDuplicateTemplate] = useState(false);
  const [canArchiveTemplate, setCanArchiveTemplate] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCanCreateTemplate(hasPermission("templates.create"));
    setCanEditTemplate(hasPermission("templates.edit"));
    setCanDuplicateTemplate(hasPermission("templates.duplicate"));
    setCanArchiveTemplate(hasPermission("templates.archive"));
  }, []);

  const canSave = useMemo(
    () =>
      (editing ? canEditTemplate : canCreateTemplate) &&
      name.trim().length > 1 &&
      type.trim().length > 1 &&
      content.trim().length > 10 &&
      !submitting,
    [canCreateTemplate, canEditTemplate, content, editing, name, submitting, type],
  );

  function loadStarter(cat: string, sub: string) {
    const starter = STARTER_TEMPLATES[cat]?.[sub || "default"];
    if (starter) setContent(starter);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setSubCategory("");
    if (!editing) loadStarter(value, "");
  }

  function handleSubCategoryChange(value: string) {
    setSubCategory(value);
    if (!editing) loadStarter(category, value);
  }

  function insertPlaceholder(placeholder: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((current) => current + placeholder);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent(content.substring(0, start) + placeholder + content.substring(end));
    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  }

  function resetForm() {
    setEditing(null);
    setName("");
    setType("contract");
    setContent("");
    setCategory("");
    setSubCategory("");
    setStatus("published");
  }

  function beginEdit(template: DocumentTemplate) {
    setEditing(template);
    setName(template.name);
    setType(template.type);
    setContent(template.content);
    setCategory(template.category ?? "");
    setSubCategory(template.sub_category ?? "");
    setStatus(template.status === "draft" ? "draft" : "published");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      setTemplates(await crmApi.templates.list());
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    async function loadCompanyName() {
      try {
        const activeId = getActiveCompanyId();
        const response = await crmApi.companies.list();
        const active = response.companies.find((company) => company.id === activeId);
        setActiveCompanyName(active?.name?.toLowerCase() ?? "");
      } catch {
        setActiveCompanyName("");
      }
    }
    void loadCompanyName();
  }, []);

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: name.trim(),
        type: type.trim(),
        category: category || undefined,
        sub_category: subCategory || undefined,
        content,
        status,
      };
      if (editing) {
        await crmApi.templates.update(editing.id, payload);
        setSuccess("Template updated and a new version was recorded.");
      } else {
        await crmApi.templates.create(payload);
        setSuccess("Template created successfully.");
      }
      resetForm();
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to save template.");
    } finally {
      setSubmitting(false);
    }
  }

  async function duplicateTemplate(template: DocumentTemplate) {
    if (!canDuplicateTemplate) return;
    setActionId(template.id);
    setError(null);
    try {
      await crmApi.templates.duplicate(template.id);
      setSuccess(`“${template.name}” duplicated successfully.`);
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to duplicate template.");
    } finally {
      setActionId(null);
    }
  }

  async function archiveTemplate(template: DocumentTemplate) {
    if (!canArchiveTemplate || !window.confirm(`Archive “${template.name}”? Existing documents will remain available.`)) return;
    setActionId(template.id);
    setError(null);
    try {
      await crmApi.templates.archive(template.id);
      if (editing?.id === template.id) resetForm();
      setSuccess("Template archived successfully.");
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to archive template.");
    } finally {
      setActionId(null);
    }
  }

  const showEditor = canCreateTemplate || (editing !== null && canEditTemplate);

  return (
    <AppShell title="Document Templates" subtitle="Build, version and control reusable company documents.">
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>
      ) : null}

      <div className={`grid grid-cols-1 gap-6 ${showEditor ? "xl:grid-cols-[minmax(0,1fr)_430px]" : ""}`}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Template library</p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-900">Controlled company content</h2>
              <p className="mt-1 text-sm text-neutral-500">{loading ? "Loading templates…" : `${templates.length} active template${templates.length === 1 ? "" : "s"}`}</p>
            </div>
            <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />)}</div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
              <p className="font-semibold text-neutral-700">No active templates</p>
              <p className="mt-1 text-sm text-neutral-400">Create the first approved template for this workspace.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const isOpen = expanded === template.id;
                return (
                  <article key={template.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <button type="button" onClick={() => setExpanded(isOpen ? null : template.id)} className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left hover:bg-neutral-50/60">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-neutral-900">{template.name}</h3>
                          <Badge label={template.status ?? "published"} colorClass={template.status === "draft" ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"} />
                          {template.category ? <Badge label={template.category} colorClass={CATEGORY_COLORS[template.category]} /> : null}
                          {template.sub_category ? <Badge label={template.sub_category} colorClass={SUB_COLORS[template.sub_category]} /> : null}
                        </div>
                        <p className="mt-2 text-xs text-neutral-400">{template.type} · Version {template.version ?? 1} · {template.documents_count ?? 0} generated documents</p>
                      </div>
                      <span className={`mt-1 text-neutral-400 transition ${isOpen ? "rotate-180" : ""}`}>⌄</span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-neutral-100 px-5 py-4">
                        <div className="mb-4 flex flex-wrap gap-2">
                          {canEditTemplate ? <button type="button" onClick={() => beginEdit(template)} className="rounded-lg bg-[#0b1f3a] px-3 py-2 text-xs font-semibold text-white">Edit</button> : null}
                          {canDuplicateTemplate ? <button type="button" onClick={() => void duplicateTemplate(template)} disabled={actionId === template.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">Duplicate</button> : null}
                          {canArchiveTemplate ? <button type="button" onClick={() => void archiveTemplate(template)} disabled={actionId === template.id} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Archive</button> : null}
                        </div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">HTML content preview</p>
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-100 bg-neutral-50 p-4 font-mono text-[11px] leading-relaxed text-neutral-600">{template.content}</pre>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {showEditor ? (
          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white shadow-sm xl:sticky xl:top-5">
            <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{editing ? "Version update" : "New template"}</p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-900">{editing ? `Edit ${editing.name}` : "Create template"}</h2>
              </div>
              {editing ? <button type="button" onClick={resetForm} className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">Cancel</button> : null}
            </div>
            <form onSubmit={saveTemplate} className="space-y-4 px-6 py-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">Category
                <select value={category} onChange={(event) => handleCategoryChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-normal normal-case text-neutral-800 outline-none focus:border-[#0b1f3a]">
                  <option value="">Select category</option><option value="NDA">NDA</option>{activeCompanyName === "vmc" ? <option value="MNDA">MNDA</option> : null}<option value="Contract">Contract</option>
                </select>
              </label>
              {category === "Contract" ? <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">Subcategory
                <select value={subCategory} onChange={(event) => handleSubCategoryChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm font-normal normal-case text-neutral-800 outline-none focus:border-[#0b1f3a]">
                  <option value="">Select subcategory</option><option value="Website Only">Website Only</option><option value="Website + Branding">Website + Branding</option><option value="Branding Only">Branding Only</option>
                </select>
              </label> : null}
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">Template name
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Standard Service Agreement" className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm font-normal normal-case outline-none focus:border-[#0b1f3a]" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">Type
                  <input value={type} onChange={(event) => setType(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm font-normal normal-case outline-none focus:border-[#0b1f3a]" />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">Status
                  <select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm font-normal normal-case outline-none focus:border-[#0b1f3a]"><option value="published">Published</option><option value="draft">Draft</option></select>
                </label>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Insert variable</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{PLACEHOLDERS.map((placeholder) => <button key={placeholder.value} type="button" onClick={() => insertPlaceholder(placeholder.value)} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:border-[#0b1f3a] hover:bg-[#0b1f3a] hover:text-white">{placeholder.label}</button>)}</div>
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">Content (HTML)
                <textarea ref={textareaRef} value={content} onChange={(event) => setContent(event.target.value)} rows={14} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 font-mono text-[11px] font-normal normal-case leading-relaxed outline-none focus:border-[#0b1f3a] focus:bg-white" />
              </label>
              <button type="submit" disabled={!canSave} className="h-11 w-full rounded-xl bg-[#0b1f3a] text-sm font-semibold text-white hover:bg-[#102b4f] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400">{submitting ? "Saving…" : editing ? "Save new version" : "Create template"}</button>
            </form>
          </aside>
        ) : null}
      </div>
    </AppShell>
  );
}
