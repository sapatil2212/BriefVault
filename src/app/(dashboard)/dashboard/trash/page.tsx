import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { TrashManager } from "@/components/dashboard/trash-manager";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Trash",
};

export default async function TrashPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Trash</h1>
        <p className="text-[13px] text-muted-foreground">
          Restore documents or remove them permanently. Deleting forever also
          removes extracted text, chunks, embeddings and AI results.
        </p>
      </div>
      <TrashManager />
    </div>
  );
}
