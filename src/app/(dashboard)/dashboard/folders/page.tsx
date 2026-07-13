import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { FoldersManager } from "@/components/dashboard/folders-manager";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Folders",
};

export default async function FoldersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Folders</h1>
        <p className="text-[13px] text-muted-foreground">
          Organize your documents into folders and matters.
        </p>
      </div>
      <FoldersManager />
    </div>
  );
}
