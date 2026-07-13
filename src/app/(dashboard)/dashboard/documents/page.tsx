import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DocumentManager } from "@/components/documents/document-manager";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "My Documents",
};

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Documents</h1>
        <p className="text-[13px] text-muted-foreground">
          Upload, search, and manage your legal documents.
        </p>
      </div>
      <DocumentManager />
    </div>
  );
}
