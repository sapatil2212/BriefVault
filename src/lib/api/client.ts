/**
 * Client-side fetch helper that understands the app's standard response
 * envelope ({ success, message, data, meta }). Throws on non-2xx / failure so
 * TanStack Query surfaces errors cleanly.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(url: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.message ?? "Request failed.",
      res.status,
      json?.code
    );
  }
  return json as ApiEnvelope<T>;
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? "Request failed.", res.status, json?.code);
  }
  return json as ApiEnvelope<T>;
}
