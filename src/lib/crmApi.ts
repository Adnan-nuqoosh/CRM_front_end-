import {
  type ApiEnvelope,
  deleteJson,
  downloadFile,
  getJson,
  patchJson,
  postForm,
  postJson,
  putJson,
  unwrap,
} from "@/lib/api";

export type Company = {
  id: number; name: string; email?: string | null; phone?: string | null; address?: string | null;
  country?: string | null; tax_number?: string | null; website?: string | null; is_active?: boolean;
  currency?: string; timezone?: string; document_prefix?: string | null; logo_url?: string | null;
};

export type Client = {
  id: number; company_id: number; name: string; email?: string | null; phone?: string | null;
  address?: string | null; tax_number?: string | null; notes?: string | null;
  status?: "active" | "inactive" | "lead" | "archived"; source?: string | null; tags?: string[] | null;
  documents_count?: number; created_at?: string; updated_at?: string;
};

export type DocumentTemplate = {
  id: number; company_id: number; name: string; type: string; category?: string | null; sub_category?: string | null;
  content: string; status?: "draft" | "published" | "archived"; version?: number; documents_count?: number;
  is_active?: boolean; created_at?: string; updated_at?: string;
};

export type Document = {
  id: number; company_id: number; client_id: number; document_template_id: number; content: string;
  pdf_path?: string | null; pdf_url?: string | null; contract_number?: string; amount?: string | number | null;
  status?: "generated" | "approved" | "archived"; document_type?: "document" | "contract";
  title?: string | null; effective_from?: string | null; effective_until?: string | null;
  client?: { id: number; name: string; email?: string | null; phone?: string | null };
  template?: { id: number; name: string; category?: string | null; sub_category?: string | null };
  creator?: { id: number; name: string }; approver?: { id: number; name: string } | null;
  approved_at?: string | null; created_at?: string; updated_at?: string;
};

export type Contract = Document;

export type ManagedUser = {
  id: number; name: string; email: string; phone?: string | null; designation?: string | null; department?: string | null;
  role: string | null; role_display_name?: string | null; companies: { id: number; name: string }[];
  active_company_id: number | null; is_active?: boolean; last_login_at?: string | null; created_at?: string;
};

export type AssignableRole = { id: number; name: string; display_name?: string; description?: string | null };
export type AssignableUser = { id: number; name: string; email: string; designation?: string | null; department?: string | null; role?: string | null };

export type Activity = {
  id: number; action: string; description?: string | null; subject_type?: string | null; subject_id?: number | null;
  old_values?: Record<string, unknown> | null; new_values?: Record<string, unknown> | null; ip_address?: string | null;
  user?: { id: number; name: string; email?: string }; created_at?: string;
};

export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";
export type Priority = "low" | "medium" | "high" | "urgent";
export type Project = {
  id: number; company_id: number; client_id?: number | null; project_manager_id?: number | null; created_by?: number | null;
  code?: string | null; name: string; description?: string | null; status: ProjectStatus; priority: Priority; progress: number;
  start_date?: string | null; due_date?: string | null; completed_date?: string | null; budget?: string | number | null;
  client?: { id: number; name: string; email?: string | null }; manager?: { id: number; name: string; email?: string; designation?: string | null };
  members?: Array<{ id: number; name: string; email?: string; designation?: string | null; department?: string | null; pivot?: { project_role?: string | null; can_manage?: boolean } }>;
  tasks_count?: number; completed_tasks_count?: number; created_at?: string; updated_at?: string;
};

export type TaskStatus = "pending" | "in_progress" | "review" | "blocked" | "completed" | "cancelled";
export type TaskComment = { id: number; comment: string; user_id: number; user_name?: string | null; user_designation?: string | null; created_at?: string };
export type TaskAttachment = { id: number; original_name: string; mime_type?: string | null; size: number; download_url?: string | null; uploaded_by?: number | null; uploader_name?: string | null; created_at?: string };
export type Task = {
  id: number; company_id: number; company_name: string | null; project_id?: number | null; project_name?: string | null; project_code?: string | null;
  title: string; description: string | null; assigned_to: number | null; assignee_name: string | null; assignee_designation?: string | null;
  assigned_by: number | null; assigner_name: string | null; status: TaskStatus; priority: Priority;
  start_date?: string | null; due_date: string | null; completed_at: string | null; comments_count?: number; attachments_count?: number;
  comments?: TaskComment[]; attachments?: TaskAttachment[]; created_at: string | null; updated_at?: string | null;
};

export type Meeting = {
  id: number; company_id: number; client_id?: number | null; project_id?: number | null; title: string; agenda?: string | null;
  starts_at: string; ends_at?: string | null; location?: string | null; meeting_url?: string | null;
  status: "scheduled" | "completed" | "cancelled"; notes?: string | null;
  client?: { id: number; name: string }; project?: { id: number; name: string; code?: string | null };
  attendees?: AssignableUser[]; created_at?: string;
};

export type FollowUp = {
  id: number; company_id: number; client_id?: number | null; project_id?: number | null; assigned_to?: number | null;
  subject: string; details?: string | null; due_at?: string | null; status: "open" | "in_progress" | "completed" | "cancelled";
  outcome?: string | null; completed_at?: string | null; client?: { id: number; name: string }; project?: { id: number; name: string; code?: string | null };
  assignee?: { id: number; name: string; designation?: string | null };
};

export type CustomerRequest = {
  id: number; company_id: number; client_id?: number | null; assigned_to?: number | null; subject: string; details?: string | null;
  priority: Priority; status: "new" | "in_progress" | "waiting" | "resolved" | "closed"; follow_up_at?: string | null;
  client?: { id: number; name: string }; assignee?: { id: number; name: string; designation?: string | null };
};

export type RoleRecord = {
  id: number; name: string; display_name: string; description?: string | null; is_system: boolean; is_active: boolean;
  permissions: string[]; users_count: number;
};
export type PermissionModule = { module: string; label: string; permissions: string[] };

export type CrmNotification = { id: number; type: string; title: string; message?: string | null; action_url?: string | null; data?: Record<string, unknown> | null; read_at?: string | null; created_at?: string };

export type DashboardData = {
  role?: string | null; roles?: string[]; scope?: Record<string, unknown>;
  summary: Record<string, number>; project_status: Record<string, number>; task_status: Record<string, number>;
  my_tasks: Task[]; my_projects: Project[]; upcoming_meetings?: Meeting[]; follow_ups?: FollowUp[];
  team_workload?: Array<{ id: number; name: string; designation?: string | null; open_tasks: number; overdue_tasks: number }>;
  recent_activity?: Activity[];
};

type Paginated<T> = ApiEnvelope<T[]> & { meta: { current_page?: number; last_page?: number; total?: number } };
const queryString = (params: Record<string, string | number | boolean | null | undefined>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "" && value !== false) q.set(key, String(value === true ? 1 : value)); });
  return q.toString() ? `?${q.toString()}` : "";
};

export const crmApi = {
  test: async () => unwrap(await getJson<ApiEnvelope<{ version: string; edition?: string }>>("/api/test")),
  auth: {
    logout: () => postJson<ApiEnvelope<null>, Record<string, never>>("/api/logout", {}),
    logoutAll: () => postJson<ApiEnvelope<null>, Record<string, never>>("/api/logout-all", {}),
  },
  dashboard: { get: async () => unwrap(await getJson<ApiEnvelope<DashboardData>>("/api/dashboard")) },

  companies: {
    async list(): Promise<{ companies: Company[]; active_company_id: number | null }> { return unwrap(await getJson<ApiEnvelope<{ companies: Company[]; active_company_id: number | null }>>("/api/companies")); },
    async create(body: { name: string; email?: string; phone?: string; address?: string; country?: string; tax_number?: string; website?: string; currency?: string; timezone?: string; document_prefix?: string }) { return unwrap(await postJson<ApiEnvelope<{ company: Company; active_company_id: number | null }>, typeof body>("/api/companies", body)); },
    async select(company_id: number) { return unwrap(await postJson<ApiEnvelope<{ company: Company; active_company_id: number }>, { company_id: number }>("/api/companies/select", { company_id })); },
    async update(id: number, body: Partial<Company>) { return unwrap(await putJson<ApiEnvelope<Company>, Record<string, unknown>>(`/api/companies/${id}`, body as Record<string, unknown>)); },
  },

  analytics: {
    async get() { return unwrap(await getJson<ApiEnvelope<{ summary: Record<string, number>; revenue_by_month: { month: string; revenue: number }[]; top_clients: { client_name: string; document_count: number; total_amount: number }[]; documents_by_month: { month: string; count: number }[]; recent_documents: Document[]; upcoming_tasks: unknown[] }>>("/api/analytics")); },
  },

  clients: {
    async list(params?: { search?: string; status?: string; archived?: boolean }): Promise<Client[]> { return unwrap(await getJson<Paginated<Client>>(`/api/clients${queryString(params ?? {})}`)) ?? []; },
    async create(body: Omit<Partial<Client>, "id" | "company_id"> & { name: string }) { return unwrap(await postJson<ApiEnvelope<Client>, Record<string, unknown>>("/api/clients", body as Record<string, unknown>)); },
    async update(id: number, body: Partial<Client>) { return unwrap(await putJson<ApiEnvelope<Client>, Record<string, unknown>>(`/api/clients/${id}`, body as Record<string, unknown>)); },
    archive: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/clients/${id}`),
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/clients/${id}`),
    async restore(id: number) { return unwrap(await patchJson<ApiEnvelope<Client>, Record<string, never>>(`/api/clients/${id}/restore`, {})); },
  },

  projects: {
    async list(params?: { search?: string; status?: ProjectStatus; priority?: Priority }): Promise<Project[]> { return unwrap(await getJson<Paginated<Project>>(`/api/projects${queryString(params ?? {})}`)) ?? []; },
    async show(id: number): Promise<Project> { return unwrap(await getJson<ApiEnvelope<Project>>(`/api/projects/${id}`)); },
    async assignableUsers(): Promise<AssignableUser[]> { return unwrap(await getJson<ApiEnvelope<AssignableUser[]>>("/api/projects/assignable-users")) ?? []; },
    async create(body: { name: string; description?: string; client_id?: number | null; project_manager_id?: number | null; status?: ProjectStatus; priority?: Priority; start_date?: string; due_date?: string; budget?: number | string; member_ids?: number[] }) { return unwrap(await postJson<ApiEnvelope<Project>, typeof body>("/api/projects", body)); },
    async update(id: number, body: Partial<Project>) { return unwrap(await putJson<ApiEnvelope<Project>, Record<string, unknown>>(`/api/projects/${id}`, body as Record<string, unknown>)); },
    async syncMembers(id: number, members: Array<{ user_id: number; project_role?: string; can_manage?: boolean }>) { return unwrap(await putJson<ApiEnvelope<Project>, { members: Array<{ user_id: number; project_role?: string; can_manage?: boolean }> }>(`/api/projects/${id}/members`, { members })); },
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/projects/${id}`),
  },

  templates: {
    async list(params?: { search?: string; status?: string; archived?: boolean }): Promise<DocumentTemplate[]> { return unwrap(await getJson<Paginated<DocumentTemplate>>(`/api/document-templates${queryString(params ?? {})}`)) ?? []; },
    async create(body: { name: string; type: string; category?: string; sub_category?: string; content: string; status?: string }) { return unwrap(await postJson<ApiEnvelope<DocumentTemplate>, typeof body>("/api/document-templates", body)); },
    async update(id: number, body: Partial<DocumentTemplate>) { return unwrap(await putJson<ApiEnvelope<DocumentTemplate>, Record<string, unknown>>(`/api/document-templates/${id}`, body as Record<string, unknown>)); },
    async duplicate(id: number) { return unwrap(await postJson<ApiEnvelope<DocumentTemplate>, Record<string, never>>(`/api/document-templates/${id}/duplicate`, {})); },
    archive: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/document-templates/${id}`),
    async restore(id: number) { return unwrap(await patchJson<ApiEnvelope<DocumentTemplate>, Record<string, never>>(`/api/document-templates/${id}/restore`, {})); },
  },

  documents: {
    async list(params?: { search?: string; status?: string; archived?: boolean }): Promise<Document[]> { return unwrap(await getJson<Paginated<Document>>(`/api/documents${queryString(params ?? {})}`)) ?? []; },
    async generate(body: { client_id: number; template_id: number; amount: string | number; price?: string; client_address?: string; contract_date?: string; delivery_date?: string; language?: "en" | "ar"; preview?: boolean; document_type?: "document" | "contract"; title?: string; effective_from?: string; effective_until?: string }) { return unwrap(await postJson<ApiEnvelope<Document>, typeof body>("/api/documents/generate", body)); },
    download: (id: number) => downloadFile(`/api/documents/download/${id}`),
    async approve(id: number) { return unwrap(await patchJson<ApiEnvelope<Document>, Record<string, never>>(`/api/documents/${id}/approve`, {})); },
    archive: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/documents/${id}`),
    async restore(id: number) { return unwrap(await patchJson<ApiEnvelope<Document>, Record<string, never>>(`/api/documents/${id}/restore`, {})); },
  },

  contracts: {
    async list(params?: { search?: string; status?: string; client_id?: number }): Promise<Contract[]> { return unwrap(await getJson<Paginated<Contract>>(`/api/contracts${queryString(params ?? {})}`)) ?? []; },
    async show(id: number): Promise<Contract> { return unwrap(await getJson<ApiEnvelope<Contract>>(`/api/contracts/${id}`)); },
    async generate(body: { client_id: number; template_id: number; amount: string | number; price?: string; client_address?: string; contract_date?: string; delivery_date?: string; language?: "en" | "ar"; preview?: boolean; title?: string; effective_from?: string; effective_until?: string }) { return unwrap(await postJson<ApiEnvelope<Contract>, Record<string, unknown>>("/api/contracts/generate", { ...body, document_type: "contract" })); },
    async update(id: number, body: Partial<Contract>) { return unwrap(await putJson<ApiEnvelope<Contract>, Record<string, unknown>>(`/api/contracts/${id}`, body as Record<string, unknown>)); },
    async approve(id: number) { return unwrap(await patchJson<ApiEnvelope<Contract>, Record<string, never>>(`/api/contracts/${id}/approve`, {})); },
    download: (id: number) => downloadFile(`/api/contracts/${id}/download`),
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/contracts/${id}`),
  },

  users: {
    async list(): Promise<ManagedUser[]> { return unwrap(await getJson<ApiEnvelope<ManagedUser[]>>("/api/users")) ?? []; },
    async assignableRoles(): Promise<AssignableRole[]> { return unwrap(await getJson<ApiEnvelope<AssignableRole[]>>("/api/users/assignable-roles")) ?? []; },
    async create(body: { name: string; email: string; password: string; phone?: string; designation?: string; department?: string; role: string; company_ids: number[] }) { return unwrap(await postJson<ApiEnvelope<ManagedUser>, typeof body>("/api/users", body)); },
    async update(id: number, body: { name?: string; email?: string; password?: string; phone?: string; designation?: string; department?: string; role?: string; company_ids?: number[] }) { return unwrap(await putJson<ApiEnvelope<ManagedUser>, typeof body>(`/api/users/${id}`, body)); },
    deactivate: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/users/${id}`),
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/users/${id}`),
    async reactivate(id: number) { return unwrap(await patchJson<ApiEnvelope<ManagedUser>, Record<string, never>>(`/api/users/${id}/restore`, {})); },
  },

  roles: {
    async list(): Promise<{ roles: RoleRecord[]; modules: PermissionModule[] }> { return unwrap(await getJson<ApiEnvelope<{ roles: RoleRecord[]; modules: PermissionModule[] }>>("/api/roles")); },
    async create(body: { display_name: string; name?: string; description?: string; permissions: string[] }) { return unwrap(await postJson<ApiEnvelope<{ id: number; name: string }>, typeof body>("/api/roles", body)); },
    async update(id: number, body: { display_name?: string; description?: string; is_active?: boolean; permissions?: string[] }) { return unwrap(await putJson<ApiEnvelope<null>, typeof body>(`/api/roles/${id}`, body)); },
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/roles/${id}`),
  },

  tasks: {
    async list(opts?: { scope?: "own"; status?: TaskStatus; priority?: Priority; project_id?: number; search?: string }): Promise<Task[]> { return unwrap(await getJson<Paginated<Task>>(`/api/tasks${queryString(opts ?? {})}`)) ?? []; },
    async show(id: number): Promise<Task> { return unwrap(await getJson<ApiEnvelope<Task>>(`/api/tasks/${id}`)); },
    async assignableUsers(projectId?: number): Promise<AssignableUser[]> { return unwrap(await getJson<ApiEnvelope<AssignableUser[]>>(`/api/tasks/assignable-users${queryString({ project_id: projectId })}`)) ?? []; },
    async create(body: { title: string; description?: string; company_id?: number; project_id?: number | null; assigned_to: number; priority?: Priority; start_date?: string; due_date?: string }) { return unwrap(await postJson<ApiEnvelope<Task>, Record<string, unknown>>("/api/tasks", body as Record<string, unknown>)); },
    async update(id: number, body: Partial<Task>) { return unwrap(await putJson<ApiEnvelope<Task>, Record<string, unknown>>(`/api/tasks/${id}`, body as Record<string, unknown>)); },
    async updateStatus(id: number, status: TaskStatus) { return unwrap(await patchJson<ApiEnvelope<Task>, { status: string }>(`/api/tasks/${id}/status`, { status })); },
    async addComment(id: number, comment: string) { return unwrap(await postJson<ApiEnvelope<TaskComment>, { comment: string }>(`/api/tasks/${id}/comments`, { comment })); },
    async addAttachment(id: number, file: File) { const form = new FormData(); form.append("file", file); return unwrap(await postForm<ApiEnvelope<TaskAttachment>>(`/api/tasks/${id}/attachments`, form)); },
    downloadAttachment: (taskId: number, attachmentId: number) => downloadFile(`/api/tasks/${taskId}/attachments/${attachmentId}`),
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/tasks/${id}`),
  },

  meetings: {
    async list(params?: { status?: Meeting["status"]; search?: string }): Promise<Meeting[]> { return unwrap(await getJson<Paginated<Meeting>>(`/api/meetings${queryString(params ?? {})}`)) ?? []; },
    async create(body: Omit<Partial<Meeting>, "id" | "company_id"> & { title: string; starts_at: string; attendee_ids?: number[] }) { return unwrap(await postJson<ApiEnvelope<Meeting>, Record<string, unknown>>("/api/meetings", body as Record<string, unknown>)); },
    async update(id: number, body: Partial<Meeting> & { attendee_ids?: number[] }) { return unwrap(await putJson<ApiEnvelope<Meeting>, Record<string, unknown>>(`/api/meetings/${id}`, body as Record<string, unknown>)); },
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/meetings/${id}`),
  },

  followUps: {
    async list(params?: { status?: FollowUp["status"]; client_id?: number; search?: string }): Promise<FollowUp[]> { return unwrap(await getJson<Paginated<FollowUp>>(`/api/follow-ups${queryString(params ?? {})}`)) ?? []; },
    async create(body: Omit<Partial<FollowUp>, "id" | "company_id"> & { subject: string }) { return unwrap(await postJson<ApiEnvelope<FollowUp>, Record<string, unknown>>("/api/follow-ups", body as Record<string, unknown>)); },
    async update(id: number, body: Partial<FollowUp>) { return unwrap(await putJson<ApiEnvelope<FollowUp>, Record<string, unknown>>(`/api/follow-ups/${id}`, body as Record<string, unknown>)); },
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/follow-ups/${id}`),
  },

  requests: {
    async list(params?: { status?: CustomerRequest["status"]; priority?: Priority; search?: string }): Promise<CustomerRequest[]> { return unwrap(await getJson<Paginated<CustomerRequest>>(`/api/requests${queryString(params ?? {})}`)) ?? []; },
    async create(body: Omit<Partial<CustomerRequest>, "id" | "company_id"> & { subject: string }) { return unwrap(await postJson<ApiEnvelope<CustomerRequest>, Record<string, unknown>>("/api/requests", body as Record<string, unknown>)); },
    async update(id: number, body: Partial<CustomerRequest>) { return unwrap(await putJson<ApiEnvelope<CustomerRequest>, Record<string, unknown>>(`/api/requests/${id}`, body as Record<string, unknown>)); },
    delete: (id: number) => deleteJson<ApiEnvelope<null>>(`/api/requests/${id}`),
  },

  notifications: {
    async list(unread=false): Promise<{ items: CrmNotification[]; unread_count: number }> { return unwrap(await getJson<ApiEnvelope<{ items: CrmNotification[]; unread_count: number }>>(`/api/notifications${unread ? "?unread=1" : ""}`)); },
    async markRead(id: number) { return unwrap(await patchJson<ApiEnvelope<CrmNotification>, Record<string, never>>(`/api/notifications/${id}/read`, {})); },
    async markAllRead() { return unwrap(await patchJson<ApiEnvelope<null>, Record<string, never>>("/api/notifications/read-all", {})); },
  },

  activities: {
    async list(params?: { search?: string; action?: string }): Promise<Activity[]> { return unwrap(await getJson<Paginated<Activity>>(`/api/activities${queryString(params ?? {})}`)) ?? []; },
  },

  search: async (q: string) => unwrap(await getJson<ApiEnvelope<{
    clients: Pick<Client, "id" | "name" | "email">[]; templates: Pick<DocumentTemplate, "id" | "name" | "category">[];
    documents: Pick<Document, "id" | "contract_number" | "status">[]; projects: Pick<Project, "id" | "code" | "name" | "status">[];
    tasks: Pick<Task, "id" | "title" | "status" | "priority">[];
  }>>(`/api/search?q=${encodeURIComponent(q)}`)),
};
