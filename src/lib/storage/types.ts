/**
 * Provider-agnostic storage contract. Every backend (filesystem, S3, R2, MinIO,
 * UploadThing) implements this interface; the rest of the app depends only on it.
 */

export interface PutOptions {
  contentType?: string;
  /** Optional original filename, retained in returned metadata. */
  fileName?: string;
}

export interface StoredObject {
  /** Provider-relative object key (includes the project namespace). */
  key: string;
  size: number;
  contentType?: string;
  fileName?: string;
  /** Resolvable URL (download route for local; direct/presigned for cloud). */
  url: string;
}

export interface StorageProvider {
  readonly name: string;
  /** Persist bytes under `key`, returning object metadata. */
  put(key: string, data: Buffer, options?: PutOptions): Promise<StoredObject>;
  /** Read bytes for `key`. Throws {@link ObjectNotFoundError} if absent. */
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Build a URL for `key` (may be a signed URL for cloud providers). */
  getUrl(key: string): Promise<string>;
}

export class ObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Storage object not found: ${key}`);
    this.name = "ObjectNotFoundError";
  }
}

export class FileTooLargeError extends Error {
  constructor(size: number, max: number) {
    super(`File size ${size} exceeds the maximum of ${max} bytes.`);
    this.name = "FileTooLargeError";
  }
}
