import { NextResponse } from "next/server";

/**
 * Standardized API response envelopes shared by every route handler.
 *
 * Success: { success: true, message, data, meta }
 * Error:   { success: false, message, error, code, timestamp }
 *
 * Keeping this in one place guarantees consistent client-side handling and
 * makes it trivial to evolve the contract in a single location.
 */

export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorBody {
  success: false;
  message: string;
  error: string;
  code: string;
  timestamp: string;
}

export function ok<T>(
  data: T,
  message = "OK",
  init?: { status?: number; meta?: Record<string, unknown> }
): NextResponse<SuccessBody<T>> {
  return NextResponse.json(
    { success: true, message, data, ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200 }
  );
}

export function fail(
  message: string,
  opts?: { status?: number; code?: string; error?: string }
): NextResponse<ErrorBody> {
  return NextResponse.json(
    {
      success: false,
      message,
      error: opts?.error ?? message,
      code: opts?.code ?? "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    },
    { status: opts?.status ?? 500 }
  );
}

/** Common error codes used across AI/document routes. */
export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNSUPPORTED: "UNSUPPORTED_FORMAT",
  PROVIDER: "PROVIDER_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL_ERROR",
} as const;
