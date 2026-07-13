"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Folder, FolderPlus, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  type FolderItem,
} from "@/hooks/use-folders";

function FolderCard({ folder }: { folder: FolderItem }) {
  const update = useUpdateFolder();
  const remove = useDeleteFolder();
  const confirm = useConfirm();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(folder.name);

  function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === folder.name) {
      setEditing(false);
      setName(folder.name);
      return;
    }
    update.mutate(
      { id: folder.id, name: trimmed },
      {
        onSuccess: () => {
          toast.success("Folder renamed.");
          setEditing(false);
        },
        onError: () => toast.error("Couldn't rename folder."),
      }
    );
  }

  async function onDelete() {
    const ok = await confirm({
      title: `Delete folder "${folder.name}"?`,
      description:
        "The folder is removed but its documents are kept — they just won't belong to a folder anymore.",
      confirmLabel: "Delete folder",
      tone: "danger",
    });
    if (!ok) return;
    remove.mutate(folder.id, {
      onSuccess: () => toast.success(`Folder "${folder.name}" deleted.`),
      onError: () => toast.error("Couldn't delete folder."),
    });
  }

  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition hover:border-violet-500/40 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500"
          style={folder.color ? { backgroundColor: `${folder.color}20`, color: folder.color } : undefined}
        >
          <Folder className="h-[18px] w-[18px]" />
        </span>

        {!editing && (
          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => setEditing(true)}
              aria-label="Rename folder"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              disabled={remove.isPending}
              aria-label="Delete folder"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10 disabled:opacity-60"
            >
              {remove.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setEditing(false);
                setName(folder.name);
              }
            }}
            className="h-8 w-full rounded-lg border border-border bg-muted px-2 text-[13px] text-foreground outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          />
          <button
            onClick={save}
            disabled={update.isPending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setName(folder.name);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Link href={`/dashboard/folders/${folder.id}`} className="mt-3 block">
          <p className="truncate text-[14px] font-semibold text-foreground group-hover:text-violet-500">
            {folder.name}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {folder.documentCount} document{folder.documentCount === 1 ? "" : "s"}
          </p>
        </Link>
      )}
    </div>
  );
}

/** Folders grid with inline create / rename / delete. */
export function FoldersManager() {
  const { data, isLoading, isError } = useFolders();
  const create = useCreateFolder();
  const [newName, setNewName] = React.useState("");

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    create.mutate(
      { name },
      {
        onSuccess: () => {
          toast.success("Folder created.");
          setNewName("");
        },
        onError: () => toast.error("Couldn't create folder."),
      }
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onCreate} className="flex max-w-md items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New folder name..."
          className="h-10 flex-1 rounded-lg border border-border bg-muted px-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20"
        />
        <button
          type="submit"
          disabled={create.isPending || !newName.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
          Create
        </button>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-600 dark:text-red-400">
          Couldn&apos;t load folders. Please refresh.
        </p>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No folders yet"
          description="Create a folder above to start organizing your documents into matters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
}
