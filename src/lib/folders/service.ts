import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Folder service. Business logic for organizing a user's documents into
 * folders. Deleting a folder detaches its documents (folderId → null) rather
 * than deleting them (enforced by the schema's onDelete: SetNull).
 */

export async function listFolders(userId: string) {
  const rows = await prisma.folder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { documents: { where: { deletedAt: null } } } },
    },
  });
  return rows.map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color,
    documentCount: f._count.documents,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));
}

export async function createFolder(
  userId: string,
  input: { name: string; color?: string | null }
) {
  return prisma.folder.create({
    data: { userId, name: input.name.trim(), color: input.color ?? null },
  });
}

export async function renameFolder(
  userId: string,
  id: string,
  input: { name?: string; color?: string | null }
) {
  const result = await prisma.folder.updateMany({
    where: { id, userId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    },
  });
  return result.count > 0;
}

export async function deleteFolder(userId: string, id: string) {
  const result = await prisma.folder.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/** A folder plus the documents it contains (auth-scoped). Null if not found. */
export async function getFolderWithDocuments(userId: string, id: string) {
  const folder = await prisma.folder.findFirst({ where: { id, userId } });
  if (!folder) return null;

  const documents = await prisma.document.findMany({
    where: { userId, folderId: id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { results: true } } },
  });

  return {
    id: folder.id,
    name: folder.name,
    color: folder.color,
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      kind: d.kind,
      status: d.status,
      resultCount: d._count.results,
      createdAt: d.createdAt,
    })),
  };
}

/**
 * Move a document into a folder (or out, when folderId is null). Validates that
 * both the document and the target folder belong to the user.
 */
export async function setDocumentFolder(
  userId: string,
  documentId: string,
  folderId: string | null
) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId, deletedAt: null },
  });
  if (!doc) return false;

  if (folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) return false;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { folderId },
  });
  return true;
}

/** Lightweight list of a user's documents for folder pickers. */
export async function listDocumentsForPicker(userId: string) {
  const rows = await prisma.document.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, title: true, folderId: true, status: true },
  });
  return rows;
}
