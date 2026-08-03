"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { crmApi, type Company } from "@/lib/crmApi";
import { getActiveCompanyId, hasPermission, setActiveCompanyId } from "@/lib/auth";

const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-normal normal-case text-neutral-800 outline-none focus:border-[#0b1f3a] focus:ring-2 focus:ring-[#0b1f3a]/10";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  tax_number: string;
  website: string;
  currency: string;
  timezone: string;
  document_prefix: string;
};

const emptyForm: FormState = {
  name: "", email: "", phone: "", address: "", country: "UAE", tax_number: "",
  website: "", currency: "AED", timezone: "Asia/Dubai", document_prefix: "",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canCreateCompany, setCanCreateCompany] = useState(false);
  const [canEditSettings, setCanEditSettings] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    setCanCreateCompany(hasPermission("companies.create"));
    setCanEditSettings(hasPermission("companies.manage.settings"));
  }, []);

  const showForm = canCreateCompany || editing !== null;
  const canSubmit = useMemo(
    () => form.name.trim().length > 1 && /^[A-Za-z]{3}$/.test(form.currency) && !submitting,
    [form.currency, form.name, submitting],
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await crmApi.companies.list();
      setCompanies(response.companies);
      setActiveId(response.active_company_id ?? getActiveCompanyId());
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  function beginEdit(company: Company) {
    setEditing(company);
    setForm({
      name: company.name,
      email: company.email ?? "",
      phone: company.phone ?? "",
      address: company.address ?? "",
      country: company.country ?? "",
      tax_number: company.tax_number ?? "",
      website: company.website ?? "",
      currency: company.currency ?? "AED",
      timezone: company.timezone ?? "Asia/Dubai",
      document_prefix: company.document_prefix ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function selectCompany(companyId: number) {
    setBusyId(companyId);
    setError(null);
    try {
      const response = await crmApi.companies.select(companyId);
      setActiveCompanyId(response.active_company_id);
      setActiveId(response.active_company_id);
      setSuccess(`Active workspace changed to ${response.company.name}.`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to switch company.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        country: form.country.trim() || undefined,
        tax_number: form.tax_number.trim() || undefined,
        website: form.website.trim() || undefined,
        currency: form.currency.trim().toUpperCase(),
        timezone: form.timezone.trim(),
        document_prefix: form.document_prefix.trim().toUpperCase() || undefined,
      };
      if (editing) {
        await crmApi.companies.update(editing.id, payload);
        setSuccess("Company settings updated successfully.");
      } else {
        const response = await crmApi.companies.create(payload);
        if (typeof response.active_company_id === "number") {
          setActiveCompanyId(response.active_company_id);
          setActiveId(response.active_company_id);
        }
        setSuccess("Company created successfully.");
      }
      resetForm();
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to save company.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Companies" subtitle="Securely switch and configure your business workspaces.">
      {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div> : null}

      <div className={`grid grid-cols-1 gap-6 ${showForm ? "xl:grid-cols-[minmax(0,1fr)_430px]" : ""}`}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Workspaces</p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-900">Authorized companies</h2>
              <p className="mt-1 text-sm text-neutral-500">{loading ? "Loading…" : `${companies.length} available workspace${companies.length === 1 ? "" : "s"}`}</p>
            </div>
            <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
          </div>

          {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />)}</div> : companies.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-400">No company is assigned to this account.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {companies.map((company) => {
                const active = activeId === company.id;
                return (
                  <article key={company.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${active ? "border-[#0b1f3a] ring-2 ring-[#0b1f3a]/10" : "border-neutral-200"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`grid h-12 w-12 place-items-center rounded-2xl text-base font-bold ${active ? "bg-[#0b1f3a] text-white" : "bg-neutral-100 text-neutral-600"}`}>{company.name.charAt(0).toUpperCase()}</div>
                      {active ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Active</span> : null}
                    </div>
                    <h3 className="mt-4 font-semibold text-neutral-900">{company.name}</h3>
                    <p className="mt-1 truncate text-xs text-neutral-400">{company.email || "No email configured"}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 text-xs">
                      <div><p className="text-neutral-400">Currency</p><p className="mt-1 font-semibold text-neutral-700">{company.currency || "AED"}</p></div>
                      <div><p className="text-neutral-400">Timezone</p><p className="mt-1 truncate font-semibold text-neutral-700">{company.timezone || "Asia/Dubai"}</p></div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => void selectCompany(company.id)} disabled={active || busyId === company.id} className="flex-1 rounded-xl bg-[#0b1f3a] px-3 py-2 text-xs font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-500">{busyId === company.id ? "Switching…" : active ? "Selected" : "Select"}</button>
                      {canEditSettings ? <button type="button" onClick={() => beginEdit(company)} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Settings</button> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {showForm ? (
          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white shadow-sm xl:sticky xl:top-5">
            <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{editing ? "Workspace settings" : "Platform administration"}</p><h2 className="mt-1 text-lg font-semibold text-neutral-900">{editing ? `Edit ${editing.name}` : "Create company"}</h2></div>
              {editing ? <button type="button" onClick={resetForm} className="text-xs font-semibold text-neutral-500">Cancel</button> : null}
            </div>
            <form onSubmit={saveCompany} className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:col-span-2">Company name<input value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Email<input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Phone<input value={form.phone} onChange={(event) => setField("phone", event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:col-span-2">Address<input value={form.address} onChange={(event) => setField("address", event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Country<input value={form.country} onChange={(event) => setField("country", event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Tax / VAT number<input value={form.tax_number} onChange={(event) => setField("tax_number", event.target.value)} className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:col-span-2">Website<input type="url" value={form.website} onChange={(event) => setField("website", event.target.value)} placeholder="https://example.com" className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Currency<input value={form.currency} maxLength={3} onChange={(event) => setField("currency", event.target.value.toUpperCase())} className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Document prefix<input value={form.document_prefix} maxLength={12} onChange={(event) => setField("document_prefix", event.target.value.toUpperCase())} placeholder="NQ" className={inputClass} /></label>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:col-span-2">Timezone<input value={form.timezone} onChange={(event) => setField("timezone", event.target.value)} placeholder="Asia/Dubai" className={inputClass} /></label>
              <button type="submit" disabled={!canSubmit} className="h-11 rounded-xl bg-[#0b1f3a] text-sm font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-400 sm:col-span-2">{submitting ? "Saving…" : editing ? "Save settings" : "Create company"}</button>
            </form>
          </aside>
        ) : null}
      </div>
    </AppShell>
  );
}
