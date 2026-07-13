import type { Metadata } from "next";
import { UploadDocument } from "@/components/dashboard/upload-document";

export const metadata: Metadata = {
  title: "Upload Document",
  description: "Upload a legal document for AI analysis.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Upload Document</h1>
        <p className="text-[13px] text-muted-foreground">
          Add a legal document to extract metadata, generate a summary, and unlock insights.
        </p>
      </div>
      <UploadDocument />
    </div>
  );
}
