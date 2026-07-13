import "server-only";
import { z } from "zod";

/**
 * Validated, env-driven storage configuration.
 *
 * The provider is selected here so switching filesystem → S3/R2/MinIO/UploadThing
 * never touches calling code (see {@link getStorageProvider}). Values have safe
 * defaults so local development works without extra setup.
 */
const envSchema = z.object({
  STORAGE_PROVIDER: z
    .enum(["local", "s3", "r2", "minio", "uploadthing"])
    .default("local"),
  STORAGE_ROOT: z.string().default("./.storage"),
  STORAGE_PROJECT: z.string().default("briefvault"),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(104_857_600), // 100 MB
  STORAGE_API_KEY: z.string().optional(),
  STORAGE_PUBLIC_URL: z.string().optional(),
  APP_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("[storage/config] Invalid storage env:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid storage environment configuration. See logs above.");
}

const env = parsed.data;

export const storageConfig = {
  provider: env.STORAGE_PROVIDER,
  root: env.STORAGE_ROOT,
  project: env.STORAGE_PROJECT,
  maxFileSize: env.MAX_FILE_SIZE,
  apiKey: env.STORAGE_API_KEY,
  publicUrl: (env.STORAGE_PUBLIC_URL || env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
} as const;

export type StorageConfig = typeof storageConfig;
