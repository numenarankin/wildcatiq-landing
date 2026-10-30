"use client";

/**
 * Crop review — the one place a user confirms what part of a photo actually gets
 * read.
 *
 * Shaped as a pure `File[] -> File[]` transform so it can sit in front of ANY
 * existing upload call without that call site knowing anything about cropping
 * (see `@/lib/scan/use-upload-hygiene`). Non-image files never reach it.
 *
 * Why it exists: an uncropped phone photo hands the model the desk, a hand, and
 * — the failure that motivated this — the facing page of an open notebook, whose
 * headings get proposed as real records. Detection is automatic; this UI is the
 * recourse for when detection is wrong, which `judgeQuad` can tell us about but
 * cannot fix on its own.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  CropIcon,
  ImageIcon,
  Loader2Icon,
  RotateCwIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import type { Jscanify } from "@/lib/scan/opencv-loader"; // landing: jscanify is not installed
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadScanner } from "@/lib/scan/opencv-loader";
import { canvasToJpeg, drawToCanvas, loadImageElement } from "@/lib/scan/capture";
import {
  SOURCE_MAX_EDGE,
  clampQuad,
  cropToQuad,
  defaultQuad,
  describeReject,
  detectPage,
  rotateCanvas,
  type Detection,
  type Frame,
  type Pt,
  type Quad,
  type RejectReason,
} from "@/lib/scan/crop";

/** What we record about one file's trip through hygiene, persisted on `files`. */
export interface HygieneMeta {
  /** Filename as uploaded, so the server can align this with its `files` entry. */
  name: string;
  /** True when the bytes we send are a perspective-corrected crop. */
  cropped: boolean;
  /** True when we deliberately sent the whole frame (no crop applied). */
  uncropped: boolean;
  rotatedDeg: 0 | 90 | 180 | 270;
  /** Why auto-crop was not trusted, when it wasn't. */
  reject: RejectReason | null;
  /** Whether the user moved a corner rather than accepting the detection. */
  adjusted: boolean;
  /** The quad used, in source-canvas pixels. Null when uncropped. */
  quad: Quad | null;
  originalBytes: number;
  outputBytes: number;
}

export interface CropReviewResult {
  /** Files to upload, in the order given (skipped ones removed). */
  files: File[];
  /** Aligned with `files`. */
  meta: HygieneMeta[];
  /** Aligned with `files`; the pre-crop file when we changed the bytes, else null. */
  originals: (File | null)[];
  /**
   * Aligned with `files`: each entry's index in the `files` PROP. Callers splice
   * results back into a larger list by this, since skipping breaks positional
   * alignment and filenames are not unique.
   */
  indices: number[];
}

/** JPEG quality for re-encoded pages. Higher than capture — this is the read copy. */
const OUTPUT_QUALITY = 0.85;
/** Loupe size and zoom, for placing a corner under a fingertip. */
const LOUPE_PX = 132;
const LOUPE_ZOOM = 3;

type Mode = "crop" | "whole";

interface Item {
  id: string;
  file: File;
  /** Normalised, unrotated source. Null when the browser couldn't decode it. */
  base: HTMLCanvasElement | null;
  /** `base` with `rotation` applied — the space `quad` lives in. */
  source: HTMLCanvasElement | null;
  detection: Detection | null;
  quad: Quad | null;
  mode: Mode;
  rotation: 0 | 90 | 180 | 270;
  adjusted: boolean;
  skipped: boolean;
}

const HANDLES = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;
type HandleKey = (typeof HANDLES)[number];

/** Swap a filename's extension — re-encoded pages are JPEG whatever came in. */
function withJpegExtension(name: string): string {
  return /\.jpe?g$/i.test(name) ? name : `${name.replace(/\.[^.]+$/, "")}.jpg`;
}

/** Express a quad as 0-1 fractions of its frame, so it can be reused at another size. */
function toRelative(quad: Quad, frame: Frame): Quad {
  const f = (p: Pt): Pt => ({ x: p.x / frame.width, y: p.y / frame.height });
  return {
    topLeft: f(quad.topLeft),
    topRight: f(quad.topRight),
    bottomRight: f(quad.bottomRight),
    bottomLeft: f(quad.bottomLeft),
  };
}

function fromRelative(quad: Quad, frame: Frame): Quad {
  const f = (p: Pt): Pt => ({ x: p.x * frame.width, y: p.y * frame.height });
  return {
    topLeft: f(quad.topLeft),
    topRight: f(quad.topRight),
    bottomRight: f(quad.bottomRight),
    bottomLeft: f(quad.bottomLeft),
  };
}

export function CropReviewModal({
  files,
  onCancel,
  onConfirm,
}: {
  /** Image files to review. Callers filter non-images out before mounting this. */
  files: File[];
  onCancel: () => void;
  onConfirm: (result: CropReviewResult) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  /** OpenCV is still arriving; handles are usable, they're just not placed yet. */
  const [detecting, setDetecting] = useState(false);
  const [building, setBuilding] = useState(false);
  const [dragging, setDragging] = useState<HandleKey | null>(null);

  const scannerRef = useRef<Jscanify | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const loupeRef = useRef<HTMLCanvasElement>(null);

  const current = items[index];
  const frame: Frame = current?.source
    ? { width: current.source.width, height: current.source.height }
    : { width: 1, height: 1 };

  // Two passes, deliberately.
  //
  // Decoding an image is fast; loading OpenCV is not (several MB of wasm to
  // fetch and compile). Doing them in that order used to mean the user stared at
  // a spinner for the whole download before seeing anything. So: decode and
  // render first, then upgrade to real detection when the scanner turns up. The
  // user can be dragging corners while it is still arriving.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Pass 1 — decode and show.
      const decoded: Item[] = [];
      for (const file of files) {
        let base: HTMLCanvasElement | null = null;
        try {
          base = drawToCanvas(await loadImageElement(file), SOURCE_MAX_EDGE);
        } catch {
          base = null; // undecodable (HEIC on most browsers) — pass through as-is.
        }
        const f: Frame = base
          ? { width: base.width, height: base.height }
          : { width: 1, height: 1 };
        decoded.push({
          id: crypto.randomUUID(),
          file,
          base,
          source: base,
          detection: null,
          quad: base ? defaultQuad(f) : null,
          mode: "whole",
          rotation: 0,
          adjusted: false,
          skipped: false,
        });
      }
      if (cancelled) return;
      setItems(decoded);
      setLoading(false);

      // Pass 2 — detection.
      setDetecting(true);
      let scanner: Jscanify | null = null;
      try {
        scanner = await loadScanner();
      } catch {
        scanner = null; // detection unavailable — everything stays manual.
      }
      if (cancelled) return;
      scannerRef.current = scanner;

      if (scanner) {
        const found = new Map<string, Detection>();
        for (const it of decoded) {
          if (cancelled) return;
          if (!it.source) continue;
          found.set(it.id, detectPage(it.source, scanner));
          // Yield between images so a multi-page batch doesn't freeze the UI
          // the user is already interacting with.
          await new Promise((r) => setTimeout(r, 0));
        }
        if (cancelled) return;
        setItems((prev) =>
          prev.map((it) => {
            const detection = found.get(it.id);
            // Never clobber a corner the user has already dragged while waiting.
            if (!detection || it.adjusted) return it;
            if (!detection.quad) return { ...it, detection };
            return {
              ...it,
              detection,
              quad: detection.quad,
              // Only auto-select "crop" when the detection is trustworthy. A
              // rejected quad still seeds the handles, but the user must accept it.
              mode: detection.reject ? "whole" : "crop",
            };
          })
        );
      }
      setDetecting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  // Blit the active source into the visible canvas whenever it changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const source = current?.source;
    if (!canvas || !source) return;
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext("2d")?.drawImage(source, 0, 0);
  }, [current?.source, current?.id]);

  const patch = useCallback((id: string, changes: Partial<Item>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...changes } : it))
    );
  }, []);

  /** Pointer position in source-canvas pixels. */
  const toCanvasPoint = useCallback((e: React.PointerEvent): Pt | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * frame.width,
      y: ((e.clientY - rect.top) / rect.height) * frame.height,
    };
  }, [frame.width, frame.height]);

  /** Draw the zoomed region around a corner, so a fingertip never hides it. */
  const paintLoupe = useCallback(
    (point: Pt) => {
      const loupe = loupeRef.current;
      const source = current?.source;
      if (!loupe || !source) return;
      const ctx = loupe.getContext("2d");
      if (!ctx) return;
      const span = LOUPE_PX / LOUPE_ZOOM;
      ctx.clearRect(0, 0, LOUPE_PX, LOUPE_PX);
      ctx.drawImage(
        source,
        point.x - span / 2,
        point.y - span / 2,
        span,
        span,
        0,
        0,
        LOUPE_PX,
        LOUPE_PX
      );
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(LOUPE_PX / 2, 0);
      ctx.lineTo(LOUPE_PX / 2, LOUPE_PX);
      ctx.moveTo(0, LOUPE_PX / 2);
      ctx.lineTo(LOUPE_PX, LOUPE_PX / 2);
      ctx.stroke();
    },
    [current?.source]
  );

  function onHandleDown(key: HandleKey, e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(key);
    const p = toCanvasPoint(e);
    if (p) paintLoupe(p);
  }

  function onHandleMove(key: HandleKey, e: React.PointerEvent) {
    if (dragging !== key || !current?.quad) return;
    const p = toCanvasPoint(e);
    if (!p) return;
    const quad = clampQuad({ ...current.quad, [key]: p }, frame);
    patch(current.id, { quad, adjusted: true, mode: "crop" });
    paintLoupe(quad[key]);
  }

  function onHandleUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
  }

  function rotate() {
    if (!current?.base) return;
    const rotation = (((current.rotation + 90) % 360) as 0 | 90 | 180 | 270);
    const source = rotateCanvas(current.base, rotation);
    const f: Frame = { width: source.width, height: source.height };
    const scanner = scannerRef.current;
    const detection = scanner ? detectPage(source, scanner) : null;
    patch(current.id, {
      rotation,
      source,
      detection,
      quad: detection?.quad ?? defaultQuad(f),
      adjusted: false,
      mode: detection?.quad && !detection.reject ? "crop" : "whole",
    });
  }

  /** Copy this page's crop to every other page — a stack of identical tickets. */
  function applyToAll() {
    if (!current?.quad || !current.source) return;
    const relative = toRelative(current.quad, frame);
    const mode = current.mode;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === current.id || !it.source) return it;
        const f: Frame = { width: it.source.width, height: it.source.height };
        return {
          ...it,
          quad: clampQuad(fromRelative(relative, f), f),
          mode,
          adjusted: true,
        };
      })
    );
  }

  async function confirm() {
    if (building) return;
    setBuilding(true);
    try {
      const out: CropReviewResult = {
        files: [],
        meta: [],
        originals: [],
        indices: [],
      };
      const scanner = scannerRef.current;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.skipped) continue;
        out.indices.push(i);

        const base: HygieneMeta = {
          name: it.file.name,
          cropped: false,
          uncropped: true,
          rotatedDeg: it.rotation,
          reject: it.detection?.reject ?? null,
          adjusted: it.adjusted,
          quad: null,
          originalBytes: it.file.size,
          outputBytes: it.file.size,
        };

        // Nothing changed — send the original bytes untouched rather than paying
        // a needless lossy re-encode.
        if (!it.source || (it.mode === "whole" && it.rotation === 0)) {
          out.files.push(it.file);
          out.meta.push(base);
          out.originals.push(null);
          continue;
        }

        const cropped =
          it.mode === "crop" && it.quad && scanner
            ? cropToQuad(it.source, it.quad, scanner)
            : null;
        const canvas = cropped ?? it.source;
        const blob = await canvasToJpeg(canvas, OUTPUT_QUALITY);
        const file = new File([blob], withJpegExtension(it.file.name), {
          type: "image/jpeg",
        });

        out.files.push(file);
        out.meta.push({
          ...base,
          cropped: cropped != null,
          uncropped: cropped == null,
          quad: cropped ? it.quad : null,
          outputBytes: file.size,
        });
        out.originals.push(it.file);
      }

      onConfirm(out);
    } finally {
      setBuilding(false);
    }
  }

  const kept = items.filter((it) => !it.skipped).length;
  const hint = detecting
    ? "Looking for the page. Drag the corners now if you'd rather place them yourself."
    : current?.detection?.reject
      ? describeReject(current.detection.reject)
      : current?.mode === "crop"
        ? "Page detected. Drag a corner if it's off."
        : "Sending the whole image.";

  return (
    <SwipeUpModal
      open
      onClose={onCancel}
      title="Check the crop"
      description="Wildcat reads only what's inside the outline. Move the corners to focus on your desired page."
      // landing: the app's `h-[90vh]`, as a share of the canvas the screen draws in.
      className="h-[90%] max-w-3xl"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2Icon className="size-8 animate-spin" />
            <p className="text-sm">Looking for the page…</p>
          </div>
        ) : (
          <>
            {/* Stage */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-black">
              {current?.source ? (
                <div className="relative inline-block max-h-full max-w-full">
                  <canvas
                    ref={canvasRef}
                    // landing: the app's `max-h-[52vh]`, of the 720px canvas.
                    className="block max-h-[374px] max-w-full object-contain"
                  />
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${frame.width} ${frame.height}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 size-full touch-none"
                  >
                    {current.quad && current.mode === "crop" && (
                      <polygon
                        points={HANDLES.map((k) => {
                          const p = current.quad![k];
                          return `${p.x},${p.y}`;
                        }).join(" ")}
                        fill="rgba(34,197,94,0.12)"
                        stroke="#22c55e"
                        strokeWidth={Math.max(2, frame.width / 300)}
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                    {current.quad &&
                      HANDLES.map((key) => {
                        const p = current.quad![key];
                        return (
                          <circle
                            key={key}
                            cx={p.x}
                            cy={p.y}
                            r={Math.max(10, frame.width / 60)}
                            fill={dragging === key ? "#16a34a" : "#22c55e"}
                            stroke="#fff"
                            strokeWidth={Math.max(2, frame.width / 400)}
                            vectorEffect="non-scaling-stroke"
                            className="cursor-grab touch-none active:cursor-grabbing"
                            onPointerDown={(e) => onHandleDown(key, e)}
                            onPointerMove={(e) => onHandleMove(key, e)}
                            onPointerUp={onHandleUp}
                            onPointerCancel={onHandleUp}
                          />
                        );
                      })}
                  </svg>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-6 text-center text-white/80">
                  <ImageIcon className="size-8" />
                  <p className="max-w-sm text-sm">
                    This image can&apos;t be previewed here. It will be uploaded
                    as-is and read in full.
                  </p>
                </div>
              )}

              {/* Loupe — the dragged corner, magnified out from under the finger. */}
              {dragging && (
                <canvas
                  ref={loupeRef}
                  width={LOUPE_PX}
                  height={LOUPE_PX}
                  className="pointer-events-none absolute right-3 top-3 rounded-full border-2 border-white/80 bg-black shadow-lg"
                />
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">{hint}</p>

            {/* Per-page actions */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant={current?.mode === "crop" ? "default" : "outline"}
                disabled={!current?.source || !current?.quad}
                onClick={() => current && patch(current.id, { mode: "crop" })}
              >
                <CropIcon /> Use crop
              </Button>
              <Button
                size="sm"
                variant={current?.mode === "whole" ? "default" : "outline"}
                disabled={!current?.source}
                onClick={() => current && patch(current.id, { mode: "whole" })}
              >
                <SquareIcon /> Whole image
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!current?.base}
                onClick={rotate}
              >
                <RotateCwIcon /> Rotate
              </Button>
              {items.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!current?.quad}
                  onClick={applyToAll}
                >
                  Apply to all
                </Button>
              )}
            </div>

            {/* Filmstrip */}
            {items.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn(
                      "relative shrink-0 rounded-md border px-3 py-2 text-left text-xs",
                      i === index && "ring-2 ring-primary",
                      it.skipped && "opacity-40"
                    )}
                  >
                    <span className="block max-w-[9rem] truncate font-medium">
                      {it.file.name}
                    </span>
                    <span className="text-muted-foreground">
                      {it.skipped
                        ? "Skipped"
                        : it.mode === "crop"
                          ? "Cropped"
                          : "Whole"}
                    </span>
                    <span
                      role="button"
                      tabIndex={-1}
                      aria-label={it.skipped ? "Include page" : "Skip page"}
                      onClick={(e) => {
                        e.stopPropagation();
                        patch(it.id, { skipped: !it.skipped });
                      }}
                      className="absolute right-1 top-1 rounded p-0.5 text-muted-foreground hover:bg-muted"
                    >
                      <XIcon className="size-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-sm text-muted-foreground">
            {kept} of {items.length} image{items.length === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={building}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={building || kept === 0}>
              {building ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
              {building ? "Preparing…" : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </SwipeUpModal>
  );
}
