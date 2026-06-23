const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
import { getToken } from "@/lib/auth";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

function buildAuthHeader(): HeadersInit {
  // Client-only: token lives in localStorage/sessionStorage.
  if (typeof window === "undefined") return {};
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  public readonly name = "ApiError";
  public readonly status: number;
  public readonly statusText: string;
  public readonly details?: unknown;

  constructor(args: { message: string; status: number; statusText: string; details?: unknown }) {
    super(args.message);
    this.status = args.status;
    this.statusText = args.statusText;
    this.details = args.details;
  }
}

async function request<TResponse>(args: {
  path: string;
  method: "GET" | "POST" | "DELETE";
  body?: unknown;
  init?: RequestInit;
}): Promise<TResponse> {
  const url = `${getApiBaseUrl()}${args.path.startsWith("/") ? args.path : `/${args.path}`}`;

  const baseHeaders: HeadersInit = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...buildAuthHeader(),
  };

  const headers: HeadersInit = {
    ...baseHeaders,
    ...(args.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(args.init?.headers ?? {}),
  };

  const res = await fetch(url, {
    method: args.method,
    headers,
    // Token auth does not require cookies; keep credentials off by default.
    credentials: args.init?.credentials ?? "omit",
    body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
    ...args.init,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Request failed (${res.status})`) as string;

    throw new ApiError({
      message,
      status: res.status,
      statusText: res.statusText,
      details: payload,
    });
  }

  return payload as TResponse;
}

export async function getJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  return request<TResponse>({ path, method: "GET", init });
}

export async function postJson<TResponse, TBody extends Record<string, unknown>>(
  path: string,
  body: TBody,
  init?: RequestInit,
): Promise<TResponse> {
  return request<TResponse>({ path, method: "POST", body, init });
}

export async function deleteJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  return request<TResponse>({ path, method: "DELETE", init });
}

export async function downloadFile(path: string, init?: RequestInit): Promise<Blob> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...buildAuthHeader(),
      ...(init?.headers ?? {}),
    },
    credentials: init?.credentials ?? "omit",
    ...init,
  });

  if (!res.ok) {
    const statusText = res.statusText;
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.toLowerCase().includes("application/json");
    const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => "");
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Download failed (${res.status})`) as string;
    throw new ApiError({ message, status: res.status, statusText, details: payload });
  }

  return res.blob();
}

