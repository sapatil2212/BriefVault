import "server-only";
import { randomUUID } from "crypto";
import { storageConfig } from "./config";
import { LocalStorageProvider } from "./local-provider";
import { FileTooLargeError, type StorageProvider } from "./types";

export type { StorageProvider, StoredObject, PutOptions } from "./types";
export { ObjectNotFoundError, FileTooLargeError } from "./types";
export { storageConfig } from "./config";

let cached: StorageProvider | null = null;

/**
 * Resolve the active storage provider from configuration. Cloud providers
 * (S3/R2/MinIO/UploadThing) implement the same {@link StorageProvider} and slot
 * in here; until added they fall back to the filesystem provider so callers
 * never break.
 */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  switch (storageConfig.provider) {
    case "s3":
    case "r2":
    case "minio":
    case "uploadthing":
    // TODO: dedicated clients implementing StorageProvider.
    case "local":
    default:
      cached = new LocalStorageProvider();
  }

  return cached;
}

export function resetStorageProvider(): void {
  cached = null;
}

/** Sanitize a filename for safe use inside an object key. */
export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

/**
 * Build a namespaced, collision-resistant object key:
 *   `{project}/{userId}/{uuid}-{filename}`
 */
export function buildObjectKey(userId: string, fileName: string): string {
  return `${storageConfig.project}/${userId}/${randomUUID()}-${safeFileName(fileName)}`;
}

/** Throw {@link FileTooLargeError} when bytes exceed the configured max. */
export function assertWithinSizeLimit(size: number): void {
  if (size > storageConfig.maxFileSize) {
    throw new FileTooLargeError(size, storageConfig.maxFileSize);
  }
}

/**
 * Convenience upload: validates size, builds a key, persists bytes, and returns
 * object metadata. This is the entry point document upload flows should use.
 */
export async function uploadFile(
  userId: string,
  fileName: string,
  data: Buffer,
  contentType?: string
) {
  assertWithinSizeLimit(data.byteLength);
  const key = buildObjectKey(userId, fileName);
  return getStorageProvider().put(key, data, { contentType, fileName });
}
