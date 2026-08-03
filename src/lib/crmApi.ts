import {
  type ApiEnvelope,
  deleteJson,
  downloadFile,
  getJson,
  patchJson,
  postJson,
  putJson,
  unwrap,
} from "@/lib/api";

export type Company = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  tax_number?: string | null;
  website?: string | null;
  is_active?: boolean;
  currency?: string;
  timezone?: string;
  document_prefix?: string | null;
  logo_url?: string | null;
};

export type Client = {
  id: number;
  company_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_number?: string | null;
  notes?: string | null;
  status?: "active" | "inactive" | "lead" | "archived";
  source?: string | null;
  tags?: string[] | null;
  documents_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type DocumentTemplate = {
  id: number;
  company_id: number;
  name: string;
  type: string;
  category?: string | null;
  sub_category?: string | null;
  content: string;
  status?: "draft" | "published" | "archived";
  version?: number;
  documents_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Document = {
  id: number;
  company_id: number;
  client_id: number;
  document_template_id: number;
  content: string;
  pdf_path?: string | null;
  pdf_url?: string | null;
  contract_number?: string;
  amount?: string | number | null;
  status?: "generated" | "approved" | "archived";
  client?: { id: number; name: string; email?: string | null };
  template?: { id: number; name: string; category?: string | null };
  creator?: { id: number; name: string };
  approver?: { id: number; name: string } | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  companies: { id: number; name: string }[];
  active_company_id: number | null;
  is_active?: boolean;
  last_login_at?: string | null;
  created_at?: string;
};

export type AssignableRole = { id: number; name: string };

export type Activity = {
  id: number;
  action: string;
  description?: string | null;
  subject_type?: string | null;
  subject_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user?: { id: number; name: string; email: string };
  created_at?: string;
};


export type Task = {
  id: number;
  company_id: number;
  company_name: string | null;
  title: string;
  description: string | null;
  assigned_to: number | null;
  assignee_name: string | null;
  assigned_by: number | null;
  assigner_name: string | null;
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export type AssignableUser = { id: number; name: string; email: string };

type Paginated<T> = ApiEnvelope<T[]> & { meta: { current_page?: number; last_page?: number; total?: number } };

export const crmApi = {
  test: async () => unwrap(await getJson<ApiEnvelope<{ version: string }>>("/api/test")),

  auth: {
    logout: () => postJson<ApiEnvelope<null>, Record<string, never>>("/api/logout", {}),
    logoutAll: () => postJson<ApiEnvelope<null>, Record<string, never>>("/api/logout-all", {}),
  },

  companies: {
    async list(): Promise<{ companies: Company[]; active_company_id: number | null }> {
      return unwrap(await getJson<ApiEnvelope<{ companies: Company[]; active_company_id: number | null }>>("/api/companies"));
    },
    async create(body: { name: string; email?: string; phone?: string; address?: string; country?: string; tax_number?: string; website?: string; currency?: string; timezone?: string; document_prefix?: string }) {
      return unwrap(await postJson<ApiEnvelope<{ company: Company; active_company_id: number | null }>, typeof body>("/api/companies", body));
    },
    async select(company_id: number) {
      return unwrap(await postJson<ApiEnvelope<{ company: Company; active_company_id: number }>, { company_id: number }>("/api/companies/select", { company_id }));
    },
    async update(id: number, body: Partial<Company>) {
      return unwrap(await putJson<ApiEnvelope<Company>, Record<string, unknown>>(`/api/companies/${id}`, body as Record<string, unknown>));
    },
  },

  analytics: {
    async get() {
      return unwrap(await getJson<ApiEnvelope<{
        summary: Record<string, number>;
        revenue_by_month: { month: string; revenue: number }[];
        top_clients: { client_name: string; document_count: number; total_amount: number }[];
        documents_by_month: { month: string; count: number }[];
        recent_documents: Document[];
        upcoming_tasks: unknown[];
      }>>("/api/analytics"));
    },
  },

  clients: {
    async list(params?: { search?: string; status?: string; archived?: boolean }): Promise<Client[]> {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.archived) query.set("archived", "1");
      const res = await getJson<Paginated<Client>>(`/api/clients${query.toString() ? `?${query.toString()}` : ""}`);
      return unwrap(res) ?? [];
    },
    async create(body: Omit<Partial<Client>, "id" | "company_id"> & { name: string }) {
      return unwrap(await postJson<ApiEnvelope<Client>, Record<string, unknown>>("/api/clients", body as Record<string, unknown>));
    },
    async update(id: number, body: Partial<Client>) {
      return unwrap(await putJson<ApiEnvelope<Client>, Record<string, unknown>>(`/api/clients/${id}`, body as Record<string, unknown>));
    },
    async archive(id: number) {
      return deleteJson<ApiEnvelope<null>>(`/api/clients/${id}`);
    },
    async delete(id: number) { return deleteJson<ApiEnvelope<null>>(`/api/clients/${id}`); },
    async restore(id: number) {
      return unwrap(await patchJson<ApiEnvelope<Client>, Record<string, never>>(`/api/clients/${id}/restore`, {}));
    },
  },

  templates: {
    async list(params?: { search?: string; status?: string; archived?: boolean }): Promise<DocumentTemplate[]> {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.archived) query.set("archived", "1");
      const res = await getJson<Paginated<DocumentTemplate>>(`/api/document-templates${query.toString() ? `?${query.toString()}` : ""}`);
      return unwrap(res) ?? [];
    },
    async create(body: { name: string; type: string; category?: string; sub_category?: string; content: string; status?: string }) {
      return unwrap(await postJson<ApiEnvelope<DocumentTemplate>, typeof body>("/api/document-templates", body));
    },
    async update(id: number, body: Partial<DocumentTemplate>) {
      return unwrap(await putJson<ApiEnvelope<DocumentTemplate>, Record<string, unknown>>(`/api/document-templates/${id}`, body as Record<string, unknown>));
    },
    async duplicate(id: number) {
      return unwrap(await postJson<ApiEnvelope<DocumentTemplate>, Record<string, never>>(`/api/document-templates/${id}/duplicate`, {}));
    },
    async archive(id: number) { return deleteJson<ApiEnvelope<null>>(`/api/document-templates/${id}`); },
    async restore(id: number) { return unwrap(await patchJson<ApiEnvelope<DocumentTemplate>, Record<string, never>>(`/api/document-templates/${id}/restore`, {})); },
  },

  documents: {
    async list(params?: { search?: string; status?: string; archived?: boolean }): Promise<Document[]> {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.archived) query.set("archived", "1");
      const res = await getJson<Paginated<Document>>(`/api/documents${query.toString() ? `?${query.toString()}` : ""}`);
      return unwrap(res) ?? [];
    },
    async generate(body: {
      client_id: number;
      template_id: number;
      amount: string | number;
      price?: string;
      client_address?: string;
      contract_date?: string;
      delivery_date?: string;
      language?: "en" | "ar";
      preview?: boolean;
    }) {
      return unwrap(await postJson<ApiEnvelope<Document>, typeof body>("/api/documents/generate", body));
    },
    download: (id: number) => downloadFile(`/api/documents/download/${id}`),
    async approve(id: number) { return unwrap(await patchJson<ApiEnvelope<Document>, Record<string, never>>(`/api/documents/${id}/approve`, {})); },
    async archive(id: number) { return deleteJson<ApiEnvelope<null>>(`/api/documents/${id}`); },
    async restore(id: number) { return unwrap(await patchJson<ApiEnvelope<Document>, Record<string, never>>(`/api/documents/${id}/restore`, {})); },
  },

  users: {
    async list(): Promise<ManagedUser[]> {
      const res = await getJson<{ data: ManagedUser[] }>("/api/users");
      return unwrap(res) ?? [];
    },
    async assignableRoles(): Promise<AssignableRole[]> {
      return unwrap(await getJson<{ data: AssignableRole[] }>("/api/users/assignable-roles")) ?? [];
    },
    async create(body: { name: string; email: string; password: string; role: string; company_ids: number[] }) {
      return postJson<{ data: ManagedUser }, typeof body>("/api/users", body);
    },
    async update(id: number, body: { name?: string; email?: string; password?: string; role?: string; company_ids?: number[] }) {
      return putJson<{ message: string }, typeof body>(`/api/users/${id}`, body);
    },
    async deactivate(id: number) { return deleteJson<{ message: string }>(`/api/users/${id}`); },
    async delete(id: number) { return deleteJson<{ message: string }>(`/api/users/${id}`); },
    async reactivate(id: number) { return patchJson<{ message: string }, Record<string, never>>(`/api/users/${id}/restore`, {}); },
  },

  tasks: {
    async list(opts?: { scope?: "own"; status?: Task["status"] }): Promise<Task[]> {
      const params = new URLSearchParams();
      if (opts?.scope) params.set("scope", opts.scope);
      if (opts?.status) params.set("status", opts.status);
      return unwrap(await getJson<{ data: Task[] }>(`/api/tasks${params.toString() ? `?${params.toString()}` : ""}`)) ?? [];
    },
    async assignableUsers(companyId: number): Promise<AssignableUser[]> {
      return unwrap(await getJson<{ data: AssignableUser[] }>(`/api/tasks/assignable-users?company_id=${companyId}`)) ?? [];
    },
    create: (body: { title: string; description?: string; company_id: number; assigned_to: number; due_date?: string }) =>
      postJson<{ data: Task }, typeof body>("/api/tasks", body),
    updateStatus: (id: number, status: Task["status"]) =>
      patchJson<{ data: Task }, { status: string }>(`/api/tasks/${id}/status`, { status }),
    delete: (id: number) => deleteJson<{ message: string }>(`/api/tasks/${id}`),
  },

  activities: {
    async list(params?: { search?: string; action?: string }): Promise<Activity[]> {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.action) query.set("action", params.action);
      const suffix = query.toString();
      return unwrap(await getJson<Paginated<Activity>>(`/api/activities${suffix ? `?${suffix}` : ""}`)) ?? [];
    },
  },

  search: async (q: string) =>
    unwrap(await getJson<ApiEnvelope<{
      clients: Pick<Client, "id" | "name" | "email">[];
      templates: Pick<DocumentTemplate, "id" | "name" | "category">[];
      documents: Pick<Document, "id" | "contract_number" | "status">[];
      tasks: Pick<Task, "id" | "title" | "status">[];
    }>>(`/api/search?q=${encodeURIComponent(q)}`)),
};
