"use client";

import { useEffect, useRef, useState } from "react";
import {
  UploadCloudIcon,
  FileTextIcon,
  XIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spokes } from "@/components/ui/spokes";
import { Button } from "@/components/ui/button";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { MAX_UPLOAD_LABEL, formatBytes } from "@/lib/files/limits";
import { pasteKind } from "@/lib/files/paste-kind";

// landing: Files picking, the credit gate and the upload action are the app's;
// the demo never opens the picker and never runs out of credits.
function FilePickerPanel(props: {
  excludeIds: string[];
  onCancel: () => void;
  onSelect: (ids: string[], picked: { id: string; name: string }[]) => void;
}) {
  void props;
  return null;
}
function useAiCreditsBlocked(): boolean {
  return false;
}
function AiCreditsNotice(props: { action: string; variant?: "after"; className?: string }) {
  void props;
  return null;
}
/** landing: the shape `uploadFiles` resolves with, as far as this modal reads it. */
export interface UploadResult {
  proposals: IngestProposal[];
  scan: { status: IngestScanStatus };
}
import type { IngestProposal } from "@/lib/ai/ingest/actions";
import type { IngestScanStatus } from "@/lib/ai/ingest/types";
import { noCardMessage } from "@/lib/ai/ingest/scan-status-copy";
import { productionFirst } from "@/lib/ai/ingest/proposal-order";

/** A document to read: new bytes from the device, or one already in Files. */
type Queued =
  | { id: string; file: File; storedId?: never; name?: never }
  | { id: string; file?: never; storedId: string; name: string };

/** This modal's own default for the one line that differs by host — a tank and
 *  a meter hold different record types. Everything else uses the shared copy. */
const DEVICE_NO_RECORDS = "The document was read but held nothing that maps to this device.";

/**
 * "Add History": drag/drop a document, the AI parses it, and the extracted rows
 * open in the approval modal pre-targeted at the host entity (a tank or a meter).
 * Mirrors the Data Entry dropzone, in a modal like the settlements upload.
 * Nothing is written until the user approves. Copy is host-supplied so the same
 * component serves both tank gauge sheets and meter gas logs.
 */
export function AddHistoryModal({
  open,
  onClose,
  onUpload,
  onAttachStored,
  onProposals,
  title = "Add History",
  description = "Upload a document and let AI propose the records it holds.",
  noRecordsMessage,
  initialFiles,
  script = null,
}: {
  open: boolean;
  onClose: () => void;
  /** Upload + AI-parse the files, scoped to the host entity. */
  onUpload: (files: File[]) => Promise<UploadResult>;
  /**
   * Read documents ALREADY in Files, scoped the same way. Given, a "Choose from
   * Files" button appears under the drop target, as on a well's upload modal.
   */
  onAttachStored?: (fileIds: string[]) => Promise<UploadResult>;
  /** Hand the proposals to the parent to open the approval modal. */
  onProposals: (proposals: IngestProposal[]) => void;
  /** Modal heading. */
  title?: string;
  /** Modal subheading (what kinds of records this host expects). */
  description?: string;
  /** Override the "read but nothing mapped" message with host-specific record types. */
  noRecordsMessage?: string;
  /** landing: files already queued when the screen opens. */
  initialFiles?: File[];
  /** landing: the press the demo makes for the reader. */
  script?: "upload" | null;
}) {
  const [files, setFiles] = useState<Queued[]>(() =>
    (initialFiles ?? []).map((file) => ({ id: `queued-${file.name}`, file }))
  );
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"upload" | "parsing" | "done">("upload");
  const [status, setStatus] = useState<IngestScanStatus | null>(null);
  const creditsBlocked = useAiCreditsBlocked();
  const [error, setError] = useState<string | null>(null);
  /** The body is showing the file picker instead of the drop target. */
  const [picking, setPicking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the form each time the modal opens (render-time pattern, no effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFiles([]);
      setPhase("upload");
      setStatus(null);
      setError(null);
      setPicking(false);
    }
  }

  function addFiles(list: FileList | File[]) {
    const added = Array.from(list).map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.round(file.size)}`,
      file,
    }));
    setFiles((prev) => [...prev, ...added]);
  }

  /** Queue documents picked out of Files: a reference, no bytes. */
  function addStored(picked: { id: string; name: string }[]) {
    const queued = new Set(files.map((f) => f.storedId).filter(Boolean));
    const added = picked
      .filter((p) => !queued.has(p.id))
      .map((p) => ({ id: `stored-${p.id}`, storedId: p.id, name: p.name }));
    setFiles((prev) => [...prev, ...added]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  /*
   * PASTE. Copied text — an email of gauge readings, a few rows out of a
   * spreadsheet, a text from the pumper — is a document as far as this pipeline
   * is concerned, so it becomes one: a `.txt` File joining the same queue, shown
   * in the same list, sent through the same upload. `buildDocumentPart` passes a
   * text file straight through with no OCR and no model read, so pasted text is
   * both the cheapest and the fastest thing this modal can be given.
   *
   * Deliberately NOT a second dropzone or a textarea beside the first: the modal
   * keeps exactly the controls it had, and paste is a gesture rather than a
   * widget. The hint under the dropzone is the only thing that grew.
   *
   * On the document, not the dropzone: nothing here takes focus, so a paste
   * lands on `body` and never reaches a handler bound to the drop target.
   */
  useEffect(() => {
    if (!open || phase !== "upload") return;
    function onPaste(e: ClipboardEvent) {
      // A copied FILE (a screenshot, a PDF from the file manager) is already
      // what the dropzone wants; let it through untouched.
      if (e.clipboardData?.files.length) {
        addFiles(e.clipboardData.files);
        return;
      }
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;
      e.preventDefault();
      const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");
      // NAMED FOR WHAT IT IS: a table copied out of GreaseBook or Excel is
      // queued as a table, so the pipeline can parse it instead of paying a
      // model to read it. Prose still pastes as `.txt` (see `pasteKind`).
      const { ext, mime } = pasteKind(text);
      addFiles([new File([text], `Pasted text ${stamp}.${ext}`, { type: mime })]);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [open, phase]);

  /** Resolve a no-card status to its user-facing message (host may override no_records). */
  function messageFor(s: IngestScanStatus): string {
    return noCardMessage(s as Exclude<IngestScanStatus, "records">, {
      no_records: noRecordsMessage || DEVICE_NO_RECORDS,
    });
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setPhase("parsing");
    setError(null);
    try {
      const uploads = files.flatMap((f) => (f.file ? [f.file] : []));
      const storedIds = files.flatMap((f) => (f.storedId ? [f.storedId] : []));
      const results = await Promise.all([
        uploads.length > 0 ? onUpload(uploads) : null,
        storedIds.length > 0 && onAttachStored ? onAttachStored(storedIds) : null,
      ]);
      const done = results.filter((r): r is UploadResult => r !== null);
      const proposals = productionFirst(done.flatMap((r) => r.proposals));
      if (proposals.length > 0) {
        onProposals(proposals);
        onClose();
        return;
      }
      setStatus(done[0]?.scan.status ?? null);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setPhase("done");
    }
  }

  // landing: the scripted press, made through the same handler a click uses.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the press is the script's, not a derivation
    if (script === "upload" && phase === "upload" && files.length > 0) void handleUpload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on the script step only
  }, [script]);

  const totalBytes = files.reduce((sum, f) => sum + (f.file?.size ?? 0), 0);

  return (
    <SwipeUpModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      className="max-w-2xl"
    >
      {/* Picking REPLACES the body rather than stacking a second modal on top,
          the same as the well upload modal. */}
      {picking ? (
        <FilePickerPanel
          excludeIds={files.flatMap((f) => (f.storedId ? [f.storedId] : []))}
          onCancel={() => setPicking(false)}
          onSelect={(_ids, picked) => {
            setPicking(false);
            addStored(picked);
          }}
        />
      ) : (
      <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {phase === "parsing" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            {/* The app's own spinner (`LoadingScreen` uses the same size and
                colour), not lucide's — one waiting indicator everywhere. */}
            <Spokes className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Reading the document and extracting records…
            </p>
          </div>
        ) : phase === "done" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            {status === "no_credits" ? (
              // Not a dead end with an apology — the one outcome with a fix the
              // user can buy. Same component every other surface uses.
              <AiCreditsNotice variant="after" action="read this document" />
            ) : (
              <>
                <AlertTriangleIcon className="size-8 text-amber-500" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  {error ?? (status ? messageFor(status) : "Nothing to add.")}
                </p>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFiles([]);
                setPhase("upload");
              }}
            >
              Try another document
            </Button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 px-6 py-12 text-center transition-colors",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-foreground/20 bg-background hover:border-foreground/40"
              )}
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full transition-colors",
                  dragging
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <UploadCloudIcon className="size-6" />
              </span>
              <span className="text-sm font-medium">
                {dragging ? "Drop to add files" : "Drag & drop files here"}
              </span>
              <span className="text-xs text-muted-foreground">
                {/* No key hint: the shortcut differs by platform and detecting
                    it here renders one thing on the server and another in the
                    browser. "Paste text" is the whole instruction anyway. */}
                or click to browse · paste text · up to {MAX_UPLOAD_LABEL} total
              </span>
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {onAttachStored ? (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="self-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Choose from Files
              </button>
            ) : null}

            {files.length > 0 ? (
              <ul className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2"
                  >
                    <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {f.file ? f.file.name : f.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {f.file ? formatBytes(f.file.size) : "In Files"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.file ? f.file.name : f.name}`}
                      onClick={() => removeFile(f.id)}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      {phase === "upload" && creditsBlocked ? (
        // Before the click, not after: picking files and waiting only to be
        // told the balance was empty is the version of this that wastes time.
        <div className="px-5 pb-2">
          <AiCreditsNotice action="read this document" />
        </div>
      ) : null}
      {phase === "upload" ? (
        <div className="flex items-center justify-between gap-2 border-t px-5 py-4">
          <span className="text-xs text-muted-foreground tabular-nums">
            {files.length > 0
              ? `${files.length} file${files.length === 1 ? "" : "s"} · ${formatBytes(totalBytes)}`
              : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={files.length === 0 || creditsBlocked}
              onClick={() => void handleUpload()}
            >
              <CheckCircle2Icon className="size-4" />
              Upload
            </Button>
          </div>
        </div>
      ) : null}
      </>
      )}
    </SwipeUpModal>
  );
}
