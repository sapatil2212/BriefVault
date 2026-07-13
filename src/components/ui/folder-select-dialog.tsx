"use client";

import * as React from "react";
import { X, Folder, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FolderOption {
  id: string;
  name: string;
  color: string | null;
}

interface FolderSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  folders: FolderOption[];
  onCreateFolder?: () => void;
}

/**
 * Modal dialog for selecting a folder before uploading documents.
 * Features:
 * - "No folder" option
 * - List of available folders
 * - Create new folder link
 * - Smooth animations
 * - Click outside to close
 */
export function FolderSelectDialog({
  open,
  onClose,
  onSelect,
  folders,
  onCreateFolder,
}: FolderSelectDialogProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Close on ESC key
  React.useEffect(() => {
    if (!open) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSelect = (folderId: string | null) => {
    setSelectedId(folderId);
  };

  const handleConfirm = () => {
    onSelect(selectedId);
    onClose();
    setSelectedId(null);
  };

  const handleCancel = () => {
    onClose();
    setSelectedId(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div className="mx-4 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">
                Select Folder
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Choose where to save this document
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-4">
            <div className="space-y-1">
              {/* No folder option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                  selectedId === null
                    ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/20"
                    : "border-border hover:bg-muted"
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">
                    No Folder
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Save in root directory
                  </p>
                </div>
                {selectedId === null && (
                  <div className="h-2 w-2 rounded-full bg-violet-600" />
                )}
              </button>

              {/* Folder list */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleSelect(folder.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                    selectedId === folder.id
                      ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/20"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: folder.color
                        ? `${folder.color}20`
                        : "hsl(var(--muted))",
                    }}
                  >
                    <Folder
                      className="h-4 w-4"
                      style={{
                        color: folder.color || "hsl(var(--violet-500))",
                      }}
                    />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">
                      {folder.name}
                    </p>
                  </div>
                  {selectedId === folder.id && (
                    <div className="h-2 w-2 rounded-full bg-violet-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Create folder link */}
            {onCreateFolder && (
              <button
                type="button"
                onClick={() => {
                  onCreateFolder();
                  handleCancel();
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-[13px] font-medium text-muted-foreground transition hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-600"
              >
                <FolderPlus className="h-4 w-4" />
                Create New Folder
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border p-4">
            <button
              onClick={handleCancel}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-violet-700"
            >
              Continue Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
