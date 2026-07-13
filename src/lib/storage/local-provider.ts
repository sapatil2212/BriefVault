import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { storageConfig } from "./config";
import {
  ObjectNotFoundError,
  type PutOptions,
  type StorageProvider,
  type StoredObject,
} from "./types";

/**
 * Filesystem storage provider (default; ideal for development and single-node
 * deployments). Objects are written under `STORAGE_ROOT`, and URLs point at the
 * authenticated download route (`/api/storage/[...key]`).
 *
 * Keys are sanitized to stay within the storage root — no `..` traversal.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  /** Absolute, traversal-safe path for a key inside the storage root. */
  private resolve(key: string): string {
    const root = path.resolve(storageConfig.root);
    const normalized = path
      .normalize(key)
      .replace(/^([/\\])+/, "")
      .replace(/\\/g, "/");
    const full = path.resolve(root, normalized);
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error(`Illegal storage key (path traversal): ${key}`);
    }
    return full;
  }

  async put(key: string, data: Buffer, options?: PutOptions): Promise<StoredObject> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return {
      key,
      size: data.byteLength,
      contentType: options?.contentType,
      fileName: options?.fileName,
      url: await this.getUrl(key),
    };
  }

  async get(key: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ObjectNotFoundError(key);
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${storageConfig.publicUrl}/api/storage/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}
