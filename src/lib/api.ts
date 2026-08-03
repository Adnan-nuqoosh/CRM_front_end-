import { clearAuth, getToken } from "@/lib/auth";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export type ApiEnvelope<T> = {
  status: boolean;
  code: number;
  message: string;
  data: T;
  errors: unknown;
  meta: Record<string, unknown>;
};

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

function buildAuthHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  public readonly name = "ApiError";
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

function firstValidationMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("errors" in payload)) return null;
  const errors = (payload as { errors?: unknown }).errors;
  if (!errors || typeof errors !== "object") return null;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }
  return null;
}

async function request<TResponse>(args: {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  init?: RequestInit;
}): Promise<TResponse> {
  const url = `${getApiBaseUrl()}${args.path.startsWith("/") ? args.path : `/${args.path}`}`;
  const isFormData = typeof FormData !== "undefined" && args.body instanceof FormData;

  const res = await fetch(url, {
    method: args.method,
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...buildAuthHeader(),
      ...(!isFormData && args.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(args.init?.headers ?? {}),
    },
    credentials: "omit",
    body:
      args.body === undefined
        ? undefined
        : isFormData
          ? (args.body as FormData)
          : JSON.stringify(args.body),
    ...args.init,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      firstValidationMessage(payload) ??
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Request failed (${res.status})`);

    if (res.status === 401 && !args.path.endsWith("/login") && typeof window !== "undefined") {
      clearAuth();
      window.location.assign("/login?expired=1");
    }

    throw new ApiError(message, res.status, payload);
  }

  return payload as TResponse;
}

export const getJson = <T>(path: string, init?: RequestInit) =>
  request<T>({ path, method: "GET", init });
export const postJson = <T, B extends Record<string, unknown>>(path: string, body: B, init?: RequestInit) =>
  request<T>({ path, method: "POST", body, init });
export const putJson = <T, B extends Record<string, unknown>>(path: string, body: B, init?: RequestInit) =>
  request<T>({ path, method: "PUT", body, init });
export const patchJson = <T, B extends Record<string, unknown>>(path: string, body: B, init?: RequestInit) =>
  request<T>({ path, method: "PATCH", body, init });
export const deleteJson = <T>(path: string, init?: RequestInit) =>
  request<T>({ path, method: "DELETE", init });

export async function downloadFile(path: string): Promise<Blob> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { headers: buildAuthHeader(), credentials: "omit" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(
      payload && typeof payload.message === "string" ? payload.message : `Download failed (${res.status})`,
      res.status,
      payload,
    );
  }
  return res.blob();
}

export function unwrap<T>(response: ApiEnvelope<T> | { data: T } | T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}
