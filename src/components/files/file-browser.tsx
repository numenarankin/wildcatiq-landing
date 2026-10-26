"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  FileTextIcon,
  ImageIcon,
  AudioLinesIcon,
  StickyNoteIcon,
  LinkIcon,
  FileIcon,
  ActivityIcon,
  FolderIcon,
  FolderPlusIcon,
  FilePlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
  ScanLineIcon,
  Loader2Icon,
  DownloadIcon,
  PencilIcon,
  PinIcon,
  FolderInputIcon,
  FolderMinusIcon,
  FolderUpIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAiDrawer } from "@/lib/ai/use-ai-drawer";
import { chunk, planUpload, runPool } from "@/lib/files/upload-plan";
import {
  MAX_DIRECT_UPLOAD_BYTES,
  MAX_DIRECT_UPLOAD_LABEL,
  describeUploadError,
  formatSize,
  type FinalizeItem,
} from "@/lib/files/direct-upload";
import { docHref, folderHref } from "@/lib/files/routes";
import { folderPath } from "@/lib/files/tree";
import type { RepoFile, RepoFolder } from "@/lib/kb/types";
import type { KBFileType } from "@/lib/kb/types";

/*
 * landing: everything below up to `fileKey` stands in for what the app imports
 * from server actions (`lib/files/actions`, `lib/files/upload-actions`), the
 * Supabase browser client, sonner (not installed here), the Orion context store
 * and the heavy children (DocumentViewer, DocumentEditor, MoveToFolderDialog,
 * ScanModal). A product screen never uploads, writes, or opens a file, so the
 * actions resolve without doing anything and the children render nothing. The
 * signatures match the app's so the component body stays as shipped.
 */
const toast = { error: (message: string) => void message };
const noopAction = async (...args: unknown[]): Promise<void> => void args;
const createDoc = async (folderId: string): Promise<{ id: string }> => ({ id: `draft-${folderId}` });
const createFolder = noopAction;
const deleteFile = noopAction;
const deleteFolder = noopAction;
const moveFile = noopAction;
const removeFileFromFolder = noopAction;
const renameFile = noopAction;
const setPin = noopAction;
const getFileUrl = async (
  id: string,
  opts: { download: boolean },
): Promise<{ ok: true; url: string | null } | { ok: false; error: string }> => {
  void id;
  void opts;
  return { ok: false, error: "" };
};
const ensureUploadFolders = async (parentId: string, dirs: string[]): Promise<Record<string, string>> => {
  void parentId;
  void dirs;
  return {};
};
const createFileUploadTargets = async (
  count: number,
): Promise<{ bucket: string; path: string; token: string }[]> =>
  Array.from({ length: count }, () => ({ bucket: "", path: "", token: "" }));
const finalizeUploads = async (
  items: FinalizeItem[],
  opts: { scan: boolean },
): Promise<{ failed: { fileName: string; reason: string }[] }> => {
  void items;
  void opts;
  return { failed: [] };
};
const getSupabaseBrowser = () => ({
  storage: {
    from: (bucket: string) => ({
      uploadToSignedUrl: async (
        path: string,
        token: string,
        file: File,
        opts: { contentType?: string },
      ): Promise<{ error: { message: string } | null }> => {
        void bucket;
        void path;
        void token;
        void file;
        void opts;
        return { error: null };
      },
    }),
  },
});
type AiSelection =
  | { kind: "file"; id: string; name: string; fileType: KBFileType }
  | { kind: "folder"; id: string; name: string }
  | null;
const NO_AI_CONTEXT = { setSelection: (selection: AiSelection) => void selection };
function useAiContext<T>(selector: (s: typeof NO_AI_CONTEXT) => T): T {
  return selector(NO_AI_CONTEXT);
}
type RasterShowing = { lasFileId: string | null };
// The viewer and editor are not ported: opening a file hands straight back to
// the folder, so a click on a screen's row leaves the listing where it was.
function BackAtOnce({ onBack }: { onBack: () => void }) {
  useEffect(() => onBack(), [onBack]);
  return null;
}
function DocumentEditor(props: { file: RepoFile; onBack: () => void }) {
  return <BackAtOnce onBack={props.onBack} />;
}
function DocumentViewer(props: {
  file: RepoFile;
  name: string;
  onBack: () => void;
  onRasterShowing: (showing: RasterShowing) => void;
}) {
  return <BackAtOnce onBack={props.onBack} />;
}
function MoveToFolderDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  root: RepoFolder;
  currentFolderId: string;
  fileName: string;
  onMove: (target: string) => void;
}) {
  void props;
  return null;
}
function ScanModal(props: { onClose: () => void; onComplete: (file: File) => void }) {
  void props;
  return null;
}

/** Selection / expansion keys: a file and a folder can share an id space. */
const fileKey = (id: string) => `f:${id}`;
const folderKey = (id: string) => `d:${id}`;

const TYPE_ICON: Record<KBFileType, LucideIcon> = {
  pdf: FileTextIcon,
  doc: FileTextIcon,
  md: FileTextIcon,
  transcript: AudioLinesIcon,
  note: StickyNoteIcon,
  url: LinkIcon,
  image: ImageIcon,
  las: ActivityIcon,
};

interface FileBrowserProps {
  root: RepoFolder;
  /**
   * The folder to show. Defaults to the root.
   *
   * With `basePath` set this comes from the URL, which is what makes a reload
   * land back where the user was.
   */
  folderId?: string;
  /**
   * Route prefix for folder links. Set it and the browser navigates (every
   * folder gets an address); leave it off and it keeps its position in local
   * state, which is what an embedded browser inside another page's tab needs.
   */
  basePath?: string;
  /**
   * Embedded in a page that owns its own chrome (the project workspace): drop
   * the root folder's name from the breadcrumb, the search box, and the Add
   * menu. That page's toolbar already names the project and carries its own
   * add actions, so all three would be a second copy of what sits right above.
   * Only the trail below the root remains, for navigating back out of a
   * subfolder.
   */
  embedded?: boolean;
  /** landing: the folder an unrouted screen opens on (the app opens at the root). */
  initialFolderId?: string;
  /** landing: file ids a screen opens ticked (the app opens with none). */
  initialSelected?: string[];
}

/**
 * Ids of the folders mirrored from Dropbox (and the Dropbox root). A file
 * placed in one sits where Dropbox put it, so it cannot be moved, pinned or
 * removed from there; the same file linked into an ordinary folder can.
 */
function cloudFolderIds(root: RepoFolder): Set<string> {
  const ids = new Set<string>();
  const walk = (folder: RepoFolder) => {
    if (folder.source === "dropbox") ids.add(folder.id);
    folder.folders.forEach(walk);
  };
  walk(root);
  return ids;
}

/** A search hit, carrying enough path to show it and to navigate there. */
interface Hit<T> {
  item: T;
  /** The containing folder's path as "Files / Leases / 2026", for display. */
  label: string;
}

interface SearchResults {
  folders: Hit<RepoFolder>[];
  files: Hit<RepoFile>[];
}

/**
 * Every folder and file in the tree whose name contains `query`, wherever it
 * lives — searching only the open folder would make the box useless for the
 * "where did I put that?" case it exists for.
 *
 * Case-insensitive substring, no fuzzy matching: with a typed query the user is
 * usually recalling part of a real name, and fuzzy hits mostly add noise.
 * Results carry their folder path so a hit is identifiable when two folders hold
 * a "notes.md", and clickable straight to where it lives.
 */
function searchTree(root: RepoFolder, query: string): SearchResults {
  const needle = query.trim().toLowerCase();
  const results: SearchResults = { folders: [], files: [] };
  if (!needle) return results;

  const walk = (folder: RepoFolder, names: string[]) => {
    const label = names.join(" / ");
    for (const file of folder.files) {
      if (file.name.toLowerCase().includes(needle)) {
        results.files.push({ item: file, label });
      }
    }
    for (const child of folder.folders) {
      if (child.name.toLowerCase().includes(needle)) {
        results.folders.push({ item: child, label });
      }
      walk(child, [...names, child.name]);
    }
  };

  walk(root, [root.name]);
  return results;
}

/**
 * Drive-style file browser, backed by Supabase. Navigates by folder id so it
 * survives the route refresh after every mutation (upload / rename / pin /
 * new folder). Pinned files float to the top of their folder.
 *
 * With `basePath` set, the open folder is the URL rather than component state,
 * so a reload, a bookmark, or browser back all land where the user was instead
 * of resetting to the root. Without it the position lives in state, which is
 * what an embedded browser inside another page's tab needs.
 */
export function FileBrowser({
  root,
  folderId,
  basePath,
  embedded = false,
  initialFolderId,
  initialSelected,
}: FileBrowserProps) {
  const router = useRouter();
  // Only consulted when `basePath` is absent; with routing on, the URL holds
  // this and a second copy here could only disagree with it.
  const [localFolderId, setLocalFolderId] = useState<string>(initialFolderId ?? root.id); // landing: seeded
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");
  const [viewing, setViewing] = useState<RepoFile | null>(null);
  const [movingFile, setMovingFile] = useState<RepoFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<RepoFile | null>(null);
  /**
   * Files deleted here but not yet gone from the tree the server sends.
   *
   * An id set rather than a copy of the list: the rows come from `root`, a tree
   * this component only reads, and the same file can be on screen as a folder
   * row or as a search hit. It is emptied the moment a refresh delivers a new
   * tree — the same re-seed `useServerState` does, written out because what
   * re-seeds (the set) is not what the server sends (the tree). So a delete
   * that failed puts its row back as soon as the refresh behind it lands.
   */
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  // The checkbox column and the expand column, the same pair the invoices
  // page's Expenses table has: tick rows to act on them together, open a
  // folder in place to see what is in it. Files have nothing under them, so
  // their expand cell is blank.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((initialSelected ?? []).map(fileKey)), // landing: seeded
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const [syncedRoot, setSyncedRoot] = useState(root);
  if (syncedRoot !== root) {
    setSyncedRoot(root);
    setDeletedIds(new Set());
  }
  const [, startTransition] = useTransition();
  /**
   * The upload in flight, if any. A count rather than a list of names: a folder
   * import is hundreds of files and "Uploading 12 of 480" is the only reading
   * of that anyone wants.
   */
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(
    null
  );
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const openDrawer = useAiDrawer((s) => s.setOpen);
  const setAiSelection = useAiContext((s) => s.setSelection);
  const skipBlurCommit = useRef(false);

  // Resolve the breadcrumb path and current folder from the (possibly
  // refreshed) tree. A folder that no longer exists falls back to the root,
  // which is what happens when the open folder is deleted from under us.
  const currentId = basePath ? (folderId ?? root.id) : localFolderId;
  const path = folderPath(root, currentId) ?? [root];
  const current = path[path.length - 1];
  const cloudFolders = useMemo(() => cloudFolderIds(root), [root]);
  // Dropbox is read-only here: nothing is added to one of its folders.
  const cloudHere = current.source === "dropbox";
  // Crumbs actually rendered: the whole path, or everything below the root when
  // the host owns the title (see `embedded`).
  const crumbs = embedded ? path.slice(1) : path;

  /**
   * Open a folder. Routed, this is a real navigation, so browser back and a
   * reload both work; embedded, it is the same position change it always was.
   */
  function openFolder(id: string) {
    setQuery("");
    if (basePath) router.push(folderHref(id, basePath));
    else setLocalFolderId(id);
  }

  // Keep the Orion drawer aware of the active file (when viewing one) or the
  // folder being browsed. Cleared when the browser unmounts.
  // A TIFF's LAS clone while its toggle shows it, so "this" is the log Orion
  // can read rather than the scan.
  const [lasShowing, setLasShowing] = useState<string | null>(null);
  const onRasterShowing = useCallback(
    (showing: RasterShowing) => setLasShowing(showing.lasFileId),
    [],
  );
  useEffect(() => {
    setAiSelection(
      viewing && lasShowing
        ? {
            kind: "file",
            id: lasShowing,
            name: viewing.name.replace(/\.tiff?$/i, ".las"),
            fileType: "las",
          }
        : viewing
          ? {
              kind: "file",
              id: viewing.id,
              name: viewing.name,
              fileType: viewing.type,
            }
          : { kind: "folder", id: current.id, name: current.name },
    );
  }, [viewing, lasShowing, current.id, current.name, setAiSelection]);

  useEffect(() => () => setAiSelection(null), [setAiSelection]);

  function openDocument(file: RepoFile) {
    // The drawer opens here rather than on the document page so that arriving
    // by click still brings Orion up beside the file, while a reload or a
    // shared link does not force a panel open the user did not ask for.
    openDrawer(true);
    if (basePath) router.push(docHref(file.id, current.id));
    else setViewing(file);
  }

  /**
   * File a pick: bytes go straight from the browser to Storage through signed
   * upload URLs, and the server is handed references.
   *
   * Nothing is POSTed through a server action here, which is the whole point —
   * `uploadFiles` buffers the whole multipart body and is capped at 100 MB for
   * the batch (`MAX_UPLOAD_BYTES`), so a document library of any real size
   * could not come in this way. See `lib/files/direct-upload.ts`.
   *
   * `scan` is off for a folder import: an AI ingest scan costs model calls per
   * document and proposes records against a library nobody is sitting waiting
   * to approve. Files still index for search either way, so Orion can read
   * them regardless.
   */
  function uploadDocs(files: File[], opts?: { scan?: boolean }) {
    if (files.length === 0) return;
    const wantScan = opts?.scan ?? true;
    const plan = planUpload(files, (f) => ({
      name: f.name,
      relativePath: f.webkitRelativePath || "",
    }));

    // Storage refuses a single PUT above 5 GB, so say so here rather than
    // letting the upload run for minutes and fail at the end.
    const overSize = plan.items.filter(
      (i) => i.file.size > MAX_DIRECT_UPLOAD_BYTES
    );
    const queueable = plan.items.filter(
      (i) => i.file.size <= MAX_DIRECT_UPLOAD_BYTES
    );
    if (overSize.length > 0) {
      toast.error(
        `Skipped ${overSize.length} file${overSize.length === 1 ? "" : "s"} over ${MAX_DIRECT_UPLOAD_LABEL}: ${overSize
          .map((i) => `${i.file.name} (${formatSize(i.file.size)})`)
          .join(", ")}`
      );
    }
    if (queueable.length === 0) return;

    setUpload({ done: 0, total: queueable.length });
    startTransition(async () => {
      const failures: string[] = [];
      try {
        // The tree first: every file needs its folder to exist before it can
        // be placed, and one pass creates each folder once.
        const folderIds =
          plan.dirs.length > 0
            ? await ensureUploadFolders(current.id, plan.dirs)
            : {};
        const jobs = queueable.map(({ file, dir }) => ({
          file,
          folderId: dir ? folderIds[dir] : current.id,
        }));

        // Signed URLs are minted, used and finalized a chunk at a time: minting
        // all of them up front would have the early ones expiring under a
        // multi-gigabyte upload, and finalizing all of them at once would put
        // one unbounded batch of background parsing in a single invocation.
        for (const group of chunk(jobs, 25)) {
          const targets = await createFileUploadTargets(group.length);
          const pairs = group.map((job, i) => ({ job, target: targets[i] }));
          const filed: FinalizeItem[] = [];

          const crashed = await runPool(
            pairs,
            4,
            async ({ job, target }) => {
              const { error } = await getSupabaseBrowser()
                .storage.from(target.bucket)
                .uploadToSignedUrl(target.path, target.token, job.file, {
                  contentType: job.file.type || undefined,
                });
              if (error) {
                failures.push(
                  `${job.file.name}: ${describeUploadError(error.message, job.file.size)}`
                );
                return;
              }
              filed.push({
                storageKey: target.path,
                fileName: job.file.name,
                mime: job.file.type || null,
                folderId: job.folderId,
              });
            },
            () => setUpload((u) => (u ? { ...u, done: u.done + 1 } : u))
          );
          // A throw rather than a returned error: a dropped connection, not a
          // rejected upload. Reported the same way, per file.
          for (const { item, error } of crashed) {
            failures.push(
              `${item.job.file.name}: ${error instanceof Error ? error.message : String(error)}`
            );
          }

          const result = await finalizeUploads(filed, { scan: wantScan });
          for (const f of result.failed) failures.push(`${f.fileName}: ${f.reason}`);
        }
        router.refresh();
      } catch (error) {
        console.error("Upload failed", error);
        failures.push(error instanceof Error ? error.message : String(error));
      } finally {
        setUpload(null);
      }

      if (failures.length > 0) {
        toast.error(
          failures.length === 1
            ? failures[0]
            : `${failures.length} files failed to upload. First: ${failures[0]}`
        );
      }
    });
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    uploadDocs(selected);
  }

  /**
   * A folder pick. Same pipeline, minus the AI scan: the files arrive carrying
   * `webkitRelativePath`, which is what `planUpload` turns into the tree.
   */
  function handleUploadFolder(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    uploadDocs(selected, { scan: false });
  }

  function handleScanned(file: File) {
    setScanning(false);
    uploadDocs([file]);
  }

  function handleCreateDoc() {
    startTransition(async () => {
      try {
        const { id } = await createDoc(current.id);
        router.refresh();
        // Open the new doc straight into the editor.
        if (basePath) {
          router.push(docHref(id, current.id));
          return;
        }
        setViewing({
          id,
          name: "Untitled.md",
          path: "Untitled.md",
          type: "md",
          folder_id: current.id,
          size: "",
          modified: "",
          pinned: false,
        });
      } catch (error) {
        console.error("Failed to create doc", error);
      }
    });
  }

  function handleCreateFolder() {
    const name = folderDraft.trim();
    setCreatingFolder(false);
    setFolderDraft("");
    if (!name) return;
    startTransition(async () => {
      try {
        await createFolder(current.id, name);
        router.refresh();
      } catch (error) {
        console.error("Failed to create folder", error);
      }
    });
  }

  function startRename(file: RepoFile) {
    setEditingId(file.id);
    setDraft(file.name);
  }

  function commitRename() {
    if (skipBlurCommit.current) {
      skipBlurCommit.current = false;
      return;
    }
    const id = editingId;
    const trimmed = draft.trim();
    setEditingId(null);
    if (!id || !trimmed) return;
    startTransition(async () => {
      try {
        await renameFile(id, trimmed);
        router.refresh();
      } catch (error) {
        console.error("Rename failed", error);
      }
    });
  }

  function cancelRename() {
    skipBlurCommit.current = true;
    setEditingId(null);
  }

  function togglePin(file: RepoFile) {
    startTransition(async () => {
      try {
        await setPin(file.id, current.id, !file.pinned);
        router.refresh();
      } catch (error) {
        console.error("Pin failed", error);
      }
    });
  }

  function handleMove(file: RepoFile, targetFolderId: string) {
    startTransition(async () => {
      try {
        await moveFile(file.id, current.id, targetFolderId);
        router.refresh();
      } catch (error) {
        console.error("Move failed", error);
      }
    });
  }

  function handleDelete(file: RepoFile) {
    setDeletingFile(null);
    // Drop the row now; the refresh confirms it on success and puts it back on
    // failure, since the tree it delivers is what `deletedIds` is filtered
    // against.
    setDeletedIds((prev) => new Set(prev).add(file.id));
    startTransition(async () => {
      try {
        await deleteFile(file.id);
      } catch (error) {
        console.error("Delete failed", error);
      }
      router.refresh();
    });
  }

  /** Take a synced file's link out of an ordinary folder; Dropbox keeps the file. */
  function handleUnlink(file: RepoFile) {
    startTransition(async () => {
      try {
        await removeFileFromFolder(file.id, file.folder_id);
      } catch (error) {
        console.error("Remove from folder failed", error);
        toast.error("Couldn't remove the file from this folder.");
      }
      router.refresh();
    });
  }

  async function handleDownload(file: RepoFile) {
    try {
      const result = await getFileUrl(file.id, { download: true });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        window.open(result.url, "_blank");
        return;
      }
    } catch (error) {
      console.error("Download failed", error);
    }
    // Inline-only docs (no stored bytes): fall back to a text placeholder.
    const blob = new Blob([`No stored file for ${file.name}`], {
      type: "text/plain",
    });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  // Searching swaps the current folder's contents for matches from anywhere in
  // the tree; clearing the box returns to wherever the user was browsing.
  const searching = query.trim().length > 0;
  const results = searching
    ? searchTree(root, query)
    : { folders: [], files: [] };
  const folders = searching
    ? results.folders.map((h) => h.item)
    : current.folders;
  const files = (
    searching ? results.files.map((h) => h.item) : current.files
  ).filter((f) => !deletedIds.has(f.id));
  // Folder path per hit, for the subtitle under a result's name.
  const hitLabel = new Map<string, string>();
  for (const hit of [...results.folders, ...results.files]) {
    hitLabel.set(hit.item.id, hit.label);
  }
  const isEmpty = folders.length === 0 && files.length === 0 && !creatingFolder;

  // Everything ticked is in this view: the keys of the rows on screen. An
  // attached document (an invoice listed under the well it charges) is not
  // selectable, because the only bulk action is delete and it cannot be
  // deleted from here.
  // Synced Dropbox rows are not selectable for the same reason.
  const visibleKeys = [
    ...folders.filter((f) => f.source !== "dropbox").map((f) => folderKey(f.id)),
    ...files
      .filter((f) => !f.attached && f.source !== "dropbox")
      .map((f) => fileKey(f.id)),
  ];
  const allSelected =
    visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));

  function toggleSelected(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(visibleKeys));
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** Delete every ticked row: files outright, folders with their contents. */
  function handleBulkDelete() {
    if (selected.size === 0 || bulkPending) return;
    const fileIds = [...selected]
      .filter((k) => k.startsWith("f:"))
      .map((k) => k.slice(2));
    const folderIds = [...selected]
      .filter((k) => k.startsWith("d:"))
      .map((k) => k.slice(2));
    setBulkPending(true);
    setDeletedIds((prev) => new Set([...prev, ...fileIds]));
    startTransition(async () => {
      try {
        await Promise.all([
          ...fileIds.map((id) => deleteFile(id)),
          ...folderIds.map((id) => deleteFolder(id)),
        ]);
      } catch (error) {
        console.error("Delete failed", error);
      }
      setSelected(new Set());
      setBulkConfirming(false);
      setBulkPending(false);
      router.refresh();
    });
  }

  const bulkBar =
    selected.size > 0 ? (
      <>
        <span className="text-sm text-muted-foreground">
          {selected.size} selected
        </span>
        {bulkConfirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Delete {selected.size}? A folder goes with everything in it. This
              can&apos;t be undone.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkConfirming(false)}
              disabled={bulkPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkPending}
            >
              {bulkPending && <Loader2Icon className="animate-spin" />}
              Confirm delete
            </Button>
          </div>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkConfirming(true)}
          >
            <Trash2Icon />
            Delete selected
          </Button>
        )}
      </>
    ) : null;

  /** The two leading cells every row has: tick, then expand. */
  function leadCells(
    key: string,
    opts: {
      selectable: boolean;
      expandable: boolean;
      onExpand?: () => void;
      label: string;
    },
  ) {
    const isOpen = expanded.has(key);
    return (
      <>
        {/* pl-3.5 lines the box up under the header's checkbox (Expenses
            table, ledger-panel.tsx). */}
        <TableCell
          className="w-8 pr-0 pl-3.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            aria-label={`Select ${opts.label}`}
            checked={selected.has(key)}
            disabled={!opts.selectable}
            onCheckedChange={() => toggleSelected(key)}
          />
        </TableCell>
        <TableCell className="w-6 px-1" onClick={(e) => e.stopPropagation()}>
          {opts.expandable ? (
            <button
              type="button"
              aria-label={
                isOpen ? `Collapse ${opts.label}` : `Expand ${opts.label}`
              }
              aria-expanded={isOpen}
              onClick={opts.onExpand}
              className="flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRightIcon
                className={cn(
                  "size-4 transition-transform",
                  isOpen && "rotate-90",
                )}
              />
            </button>
          ) : null}
        </TableCell>
      </>
    );
  }

  /** Indent nested rows by their depth without touching row height. */
  const indent = (depth: number) =>
    depth > 0 ? { paddingLeft: `${depth * 1.25}rem` } : undefined;

  // Only reachable when routing is off: with `basePath` set, a file is a page
  // of its own (`/files/docs/[id]`) and `viewing` is never set.
  if (viewing) {
    // Inline docs (markdown / notes) are editable; everything else previews,
    // and so does anything synced from Dropbox.
    const editable =
      (viewing.type === "md" || viewing.type === "note") &&
      viewing.source !== "dropbox";
    return editable ? (
      <DocumentEditor file={viewing} onBack={() => setViewing(null)} />
    ) : (
      <DocumentViewer
        file={viewing}
        name={viewing.name}
        onBack={() => setViewing(null)}
        onRasterShowing={onRasterShowing}
      />
    );
  }

  /** A folder's row, then (open) its contents, indented one step. */
  function renderFolderRows(
    folder: RepoFolder,
    depth: number,
    prefix = "",
  ): ReactNode[] {
    const key = folderKey(folder.id);
    const rowKey = `${prefix}/${key}`;
    const children = folder.files.filter((f) => !deletedIds.has(f.id));
    const hasContents = folder.folders.length > 0 || children.length > 0;
    const row = (
      <TableRow
        key={rowKey}
        // A search hit can live anywhere in the tree; the breadcrumb is
        // derived from the id, so it needs no special case here.
        onClick={() => openFolder(folder.id)}
        className="cursor-pointer"
      >
        {leadCells(key, {
          selectable: folder.source !== "dropbox",
          expandable: hasContents,
          onExpand: () => toggleExpanded(key),
          label: folder.name,
        })}
        <TableCell className="pl-0">
          <FolderIcon className="size-4 text-data-accent" fill="currentColor" />
        </TableCell>
        <TableCell style={indent(depth)}>
          <span className="font-medium text-primary-text">{folder.name}</span>
          {searching && (
            <span className="ml-2 text-xs text-tertiary-text">
              {hitLabel.get(folder.id)}
            </span>
          )}
        </TableCell>
        <TableCell className="text-tertiary-text">Folder</TableCell>
        <TableCell className="text-tertiary-text">—</TableCell>
        <TableCell className="text-tertiary-text">
          {folder.modified || "—"}
        </TableCell>
        <TableCell />
      </TableRow>
    );
    if (!expanded.has(key)) return [row];
    return [
      row,
      ...folder.folders.flatMap((f) => renderFolderRows(f, depth + 1, rowKey)),
      ...children.flatMap((f) => renderFileRows(f, depth + 1, rowKey)),
    ];
  }

  /** A file's row. */
  function renderFileRows(
    file: RepoFile,
    depth: number,
    prefix = "",
  ): ReactNode[] {
    const key = fileKey(file.id);
    const rowKey = `${prefix}/${key}`;
    const Icon = TYPE_ICON[file.type] ?? FileIcon;
    const isPinned = file.pinned ?? false;
    // A synced file keeps its Dropbox name and lives until Dropbox deletes it;
    // its place in the Dropbox tree is fixed too.
    const fromCloud = file.source === "dropbox";
    const inCloudFolder = cloudFolders.has(file.folder_id);
    const row = (
      <TableRow
        key={rowKey}
        className="group/row cursor-pointer"
        onClick={() => {
          if (editingId !== file.id) openDocument(file);
        }}
      >
        {leadCells(key, {
          selectable: !file.attached && !fromCloud,
          expandable: false,
          label: file.name,
        })}
        <TableCell className="pl-0">
          <Icon className="size-4 text-tertiary-text" />
        </TableCell>
        <TableCell style={indent(depth)}>
          {editingId === file.id ? (
            <input
              autoFocus
              value={draft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              onBlur={commitRename}
              className="w-full max-w-[280px] rounded-sm border border-border bg-background px-1.5 py-0.5 text-primary-text outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <span className="flex items-center gap-1.5 text-primary-text">
              {file.name}
              {isPinned && (
                <PinIcon className="size-3.5 fill-current text-data-accent" />
              )}
              {searching && (
                <span className="text-xs text-tertiary-text">
                  {hitLabel.get(file.id)}
                </span>
              )}
            </span>
          )}
        </TableCell>
        <TableCell className="uppercase text-tertiary-text">
          {file.type}
        </TableCell>
        <TableCell className="text-tertiary-text">{file.size}</TableCell>
        <TableCell className="text-tertiary-text">{file.modified}</TableCell>
        <TableCell>
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center justify-end gap-0.5 transition-opacity",
              "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100",
            )}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Download"
              onClick={() => handleDownload(file)}
              className="hover:text-data-accent"
            >
              <DownloadIcon />
            </Button>
            {/* An attached document (an invoice filed against this
                        well, a ticket's photo) has no placement here to
                        move, pin, rename or delete; it opens and downloads. */}
            {!file.attached && (
              <>
                {!inCloudFolder && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move to folder"
                    onClick={() => setMovingFile(file)}
                    className="hover:text-data-accent"
                  >
                    <FolderInputIcon />
                  </Button>
                )}
                {!fromCloud && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Rename"
                    onClick={() => startRename(file)}
                    className="hover:text-data-accent"
                  >
                    <PencilIcon />
                  </Button>
                )}
                {!inCloudFolder && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={isPinned ? "Unpin" : "Pin"}
                    onClick={() => togglePin(file)}
                    className={cn(
                      "hover:text-data-accent",
                      isPinned && "text-data-accent",
                    )}
                  >
                    <PinIcon className={cn(isPinned && "fill-current")} />
                  </Button>
                )}
                {fromCloud && !inCloudFolder && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove from folder"
                    onClick={() => handleUnlink(file)}
                    className="hover:text-error"
                  >
                    <FolderMinusIcon />
                  </Button>
                )}
                {!fromCloud && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    onClick={() => setDeletingFile(file)}
                    className="hover:text-error"
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
    return [row];
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Header: breadcrumbs + actions. Embedded at the project root there is
          neither, and rendering an empty row would still cost this container's
          gap — which would sit the file table lower than the tasks board that
          shares the tab strip above it. */}
      {(!embedded || crumbs.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-1">
            {/* With the root name hidden, the root is still one click away from
                anywhere deeper — as an icon rather than a repeat of the title. */}
            {embedded && path.length > 1 && (
              <button
                type="button"
                onClick={() => openFolder(root.id)}
                aria-label={`Back to ${root.name}`}
                className="rounded px-1.5 py-0.5 text-tertiary-text hover:bg-background-hover hover:text-primary-text"
              >
                <FolderIcon className="size-5" />
              </button>
            )}
            {crumbs.map((folder, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={folder.id} className="flex items-center gap-1">
                  {(i > 0 || crumbs.length < path.length) && (
                    <ChevronRightIcon className="size-5 text-tertiary-text" />
                  )}
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => openFolder(folder.id)}
                    className={cn(
                      "rounded px-1.5 py-0.5 font-heading text-2xl font-semibold tracking-tight",
                      isLast
                        ? "text-primary-text"
                        : "text-tertiary-text hover:bg-background-hover hover:text-primary-text",
                    )}
                  >
                    {folder.name}
                  </button>
                </span>
              );
            })}
          </nav>

          {/*
            TODO: Special handling for PDFs and image file formats (png, jpg,
            etc.). On upload, run the document through OCR to extract its data,
            then save a JSON or Markdown version of the doc. Store that derived
            file's name in the original upload's metadata so Orion (our AI agent)
            can read the JSON/Markdown representation instead of the raw file —
            Orion is poor at reading PDFs and images directly.
          */}
          {/* Hidden when embedded: the project toolbar carries the add actions. */}
          <div
            className={cn("items-center gap-2", embedded ? "hidden" : "flex")}
          >
            {bulkBar}
            {/* Same search control as /notes (notes-workspace.tsx:44-52), so the
                two list pages share one affordance. */}
            <div className="flex items-center gap-2 rounded-sm border border-input px-2">
              <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Search files…"
                aria-label="Search files and folders"
                className="h-8 w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* One primary action, matching the Add dropdown on the disposal
                workspaces (same trigger shape, same black button, same item
                styling) rather than a bespoke menu. Absent in a Dropbox
                folder, which only Dropbox adds to. */}
            {!cloudHere && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="lg"
                      disabled={!!upload}
                      className="bg-black text-white hover:bg-neutral-800"
                    />
                  }
                >
                  {upload ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    <PlusIcon />
                  )}
                  {upload ? "Uploading…" : "Add"}
                  <ChevronDownIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon />
                    Upload file
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => folderInputRef.current?.click()}
                  >
                    <FolderUpIcon />
                    Upload folder
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setScanning(true)}
                  >
                    <ScanLineIcon />
                    Scan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleCreateDoc}
                  >
                    <FilePlusIcon />
                    New doc
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      setFolderDraft("");
                      setCreatingFolder(true);
                    }}
                  >
                    <FolderPlusIcon />
                    New folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUploadFolder}
            // `webkitdirectory` is the only way to pick a directory, and React
            // has no typing for it; the spread is what gets it onto the DOM
            // node. `directory` is the unimplemented standard spelling, sent
            // alongside so a browser that ever ships it behaves the same.
            {...{ webkitdirectory: "", directory: "" }}
          />
        </div>
      )}

      {/* File table (borderless) */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-8 pr-0 pl-3.5">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected}
                  indeterminate={selected.size > 0 && !allSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="w-6 px-1" />
              <TableHead className="w-10 pl-0" />
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead className="w-24">Size</TableHead>
              <TableHead className="w-32">Modified</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {upload && (
              <TableRow className="hover:bg-transparent">
                <TableCell />
                <TableCell />
                <TableCell className="pl-0">
                  <Loader2Icon className="size-4 animate-spin text-tertiary-text" />
                </TableCell>
                <TableCell colSpan={5} className="text-tertiary-text">
                  {upload.total === 1
                    ? "Uploading…"
                    : `Uploading ${Math.min(upload.done + 1, upload.total)} of ${upload.total}…`}
                </TableCell>
              </TableRow>
            )}
            {creatingFolder && (
              <TableRow className="hover:bg-transparent">
                <TableCell />
                <TableCell />
                <TableCell className="pl-0">
                  <FolderIcon
                    className="size-4 text-data-accent"
                    fill="currentColor"
                  />
                </TableCell>
                <TableCell>
                  <input
                    autoFocus
                    value={folderDraft}
                    placeholder="Folder name"
                    onChange={(e) => setFolderDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateFolder();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setCreatingFolder(false);
                        setFolderDraft("");
                      }
                    }}
                    onBlur={handleCreateFolder}
                    className="w-full max-w-[280px] rounded-sm border border-border bg-background px-1.5 py-0.5 text-primary-text outline-none focus:ring-1 focus:ring-ring"
                  />
                </TableCell>
                <TableCell className="text-tertiary-text">Folder</TableCell>
                <TableCell className="text-tertiary-text">—</TableCell>
                <TableCell className="text-tertiary-text">—</TableCell>
                <TableCell />
              </TableRow>
            )}

            {folders.flatMap((folder) => renderFolderRows(folder, 0))}

            {files.flatMap((file) => renderFileRows(file, 0))}

            {isEmpty && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-tertiary-text"
                >
                  {searching
                    ? `No files or folders matching “${query.trim()}”.`
                    : "This folder is empty."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {movingFile && (
        <MoveToFolderDialog
          open={movingFile !== null}
          onOpenChange={(o) => {
            if (!o) setMovingFile(null);
          }}
          root={root}
          currentFolderId={current.id}
          fileName={movingFile.name}
          onMove={(target) => handleMove(movingFile, target)}
        />
      )}
      {scanning && (
        <ScanModal
          onClose={() => setScanning(false)}
          onComplete={handleScanned}
        />
      )}

      {deletingFile && (
        <SwipeUpModal
          open
          onClose={() => setDeletingFile(null)}
          title={`Delete “${deletingFile.name}”?`}
          description="This permanently deletes the file and removes it from every folder. This cannot be undone."
          className="max-w-[420px]"
        >
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingFile(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleDelete(deletingFile)}
              className="bg-error text-white hover:bg-error/90"
            >
              Delete
            </Button>
          </div>
        </SwipeUpModal>
      )}
    </div>
  );
}
