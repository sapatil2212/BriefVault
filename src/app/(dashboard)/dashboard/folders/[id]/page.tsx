import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getFolderWithDocuments,
  listDocumentsForPicker,
} from "@/lib/folders/service";
import { FolderDetail } from "@/components/dashboard/folder-detail";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Folder",
};

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { id } = await params;
  const [folder, candidates] = await Promise.all([
    getFolderWithDocuments(user.id, id),
    listDocumentsForPicker(user.id),
  ]);

  if (!folder) notFound();

  return (
    <FolderDetail
      folderId={folder.id}
      folderName={folder.name}
      documents={folder.documents.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        resultCount: d.resultCount,
        createdAt: d.createdAt.toISOString(),
      }))}
      candidates={candidates}
    />
  );
}
