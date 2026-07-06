import { deleteJson, downloadFile, getJson, patchJson, postJson, putJson } from "@/lib/api";

export type Company = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
};

export type Client = {
  id: number;
  company_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
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
  contract_number?: string;
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
  created_at?: string;
};

export type AssignableRole = {
  id: number;
  name: string;
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

export type AssignableUser = {
  id: number;
  name: string;
  email: string;
};

export const crmApi = {
  test() {
    return getJson<{ message: string }>("/api/test");
  },

  companies: {
    // Backend: { status, data: Company[], active_company_id }
    async list(): Promise<{ companies: Company[]; active_company_id: number | null }> {
      const res = await getJson<{
        status: string;
        data: Company[];
        active_company_id: number | null;
      }>("/api/companies");
      return {
        companies: res.data ?? [],
        active_company_id: res.active_company_id ?? null,
      };
    },

    

    async create(body: { name: string; email?: string; phone?: string }) {
      return postJson<
        { message: string; data: Company; active_company_id: number | null },
        typeof body
      >("/api/companies", body);
    },

    async select(company_id: number) {
      return postJson<
        { message: string; active_company_id: number },
        { company_id: number }
      >("/api/companies/select", { company_id });
    },
  },
  
   analytics: {
    async get(): Promise<{
      revenue_by_month: { month: string; revenue: number }[];
      top_clients: { client_name: string; document_count: number; total_amount: number }[];
      documents_by_month: { month: string; count: number }[];
    }> {
      return getJson("/api/analytics");
    },
  },

  clients: {
    // Backend: { status, data: Client[], meta: {...} }
    async list(): Promise<Client[]> {
      const res = await getJson<{
        status: string;
        data: Client[];
        meta: object;
      }>("/api/clients");
      return res.data ?? [];
    },

    async create(body: { name: string; email?: string; phone?: string; address?: string }) {
      return postJson<
        { status: string; message: string; data: Client },
        typeof body
      >("/api/clients", body);
    },

    async delete(id: number) {
      return deleteJson<{ status: string; message: string }>(`/api/clients/${id}`);
    },
  },

  templates: {
    // Backend: direct array
    async list(): Promise<DocumentTemplate[]> {
      const res = await getJson<DocumentTemplate[]>("/api/document-templates");
      return Array.isArray(res) ? res : [];
    },

    async create(body: {
      name: string;
      type: string;
      category?: string;
      sub_category?: string;
      content: string;
    }) {
      return postJson<
        { message: string; data: DocumentTemplate },
        typeof body
      >("/api/document-templates", body);
    },
  },

  documents: {
    // Backend: direct array
    async list(): Promise<Document[]> {
      const res = await getJson<Document[]>("/api/documents");
      return Array.isArray(res) ? res : [];
    },

    async generate(body: {
      client_id: number;
      template_id: number;
      amount: string | number; // numeric — backend validates numeric|min:0
      price?: string;          // optional display text; derived from amount if absent
      contract_number?: string;
      client_address?: string;
      contract_date?: string;
      delivery_date?: string;
    }) {
      return postJson<
        { message: string; document: Document; download_url: string },
        typeof body
      >("/api/documents/generate", body);
    },

    async download(id: number): Promise<Blob> {
      return downloadFile(`/api/documents/download/${id}`);
    },
  },

  users: {
    // Backend: { status, data: ManagedUser[] }
    async list(): Promise<ManagedUser[]> {
      const res = await getJson<{ status: string; data: ManagedUser[] }>("/api/users");
      return res.data ?? [];
    },

    // Roles the current user is allowed to assign (for the role dropdown).
    async assignableRoles(): Promise<AssignableRole[]> {
      const res = await getJson<{ status: string; data: AssignableRole[] }>(
        "/api/users/assignable-roles",
      );
      return res.data ?? [];
    },

    async create(body: {
      name: string;
      email: string;
      password: string;
      role: string;
      company_ids: number[];
    }) {
      return postJson<
        { status: string; message: string; data: { id: number; name: string; email: string; role: string } },
        typeof body
      >("/api/users", body);
    },

    async update(
      id: number,
      body: {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        company_ids?: number[];
      },
    ) {
      return putJson<{ status: string; message: string }, typeof body>(
        `/api/users/${id}`,
        body,
      );
    },

    async delete(id: number) {
      return deleteJson<{ status: string; message: string }>(`/api/users/${id}`);
    },
  },

  tasks: {
    // scope "own" = my tasks (all companies); default = active company (managers)
    async list(opts?: { scope?: "own"; status?: Task["status"] }): Promise<Task[]> {
      const params = new URLSearchParams();
      if (opts?.scope) params.set("scope", opts.scope);
      if (opts?.status) params.set("status", opts.status);
      const qs = params.toString();
      const res = await getJson<{ status: string; data: Task[] }>(
        `/api/tasks${qs ? `?${qs}` : ""}`,
      );
      return res.data ?? [];
    },

    // Members of a company, for the assignee dropdown (tasks.create gated)
    async assignableUsers(companyId: number): Promise<AssignableUser[]> {
      const res = await getJson<{ status: string; data: AssignableUser[] }>(
        `/api/tasks/assignable-users?company_id=${companyId}`,
      );
      return res.data ?? [];
    },

    async create(body: {
      title: string;
      description?: string;
      company_id: number;
      assigned_to: number;
      due_date?: string;
    }) {
      return postJson<{ status: string; message: string; data: Task }, typeof body>(
        "/api/tasks",
        body,
      );
    },

    async updateStatus(id: number, status: Task["status"]) {
      return patchJson<{ status: string; message: string; data: Task }, { status: string }>(
        `/api/tasks/${id}/status`,
        { status },
      );
    },

    async delete(id: number) {
      return deleteJson<{ status: string; message: string }>(`/api/tasks/${id}`);
    },
  },
};