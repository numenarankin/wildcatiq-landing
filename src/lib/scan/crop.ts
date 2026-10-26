/**
 * The page-crop engine: detect the sheet of paper in a photo, judge whether the
 * detection is trustworthy, and perspective-correct to it.
 *
 * Headless and React-free so it can be shared by the camera scanner
 * (`components/files/scan-modal.tsx`) and the upload review modal
 * (`components/scan/crop-review-modal.tsx`), and so the geometry can be unit
 * tested without a browser. Everything above `detectPage` is pure maths; only
 * `detectPage` / `cropToQuad` / `rotateCanvas` touch OpenCV or the DOM.
 *
 * Why this exists at all: an uncropped photo hands the model the desk, the
 * photographer's hand, and — the failure that motivated this — the ADJACENT page
 * of an open notebook, whose headings get read as real records. Cropping to the
 * page is the cheapest way to stop that at the source.
 *
 * Client-only (OpenCV.js is a browser wasm build).
 */

// landing: jscanify is not installed; the loader stand-in carries its types.
import type { CornerPoints, Jscanify } from "@/lib/scan/opencv-loader";

export interface Pt {
  x: number;
  y: number;
}

/** Four page corners in clockwise screen order (y grows downward). */
export interface Quad {
  topLeft: Pt;
  topRight: Pt;
  bottomRight: Pt;
  bottomLeft: Pt;
}

export interface Frame {
  width: number;
  height: number;
}

/**
 * Why a detected quad is not trustworthy enough to crop to without the user
 * confirming it. `null` means "auto-crop is safe".
 */
export type RejectReason =
  | "no-contour"
  | "not-convex"
  | "too-small"
  | "full-frame"
  | "skewed";

export interface Detection {
  /** The detected quad, or null when nothing usable was found. */
  quad: Quad | null;
  /** Null when the quad is trustworthy; otherwise why it is not. */
  reject: RejectReason | null;
  /** Coordinate space `quad` is expressed in — the source canvas size. */
  frame: Frame;
}

/**
 * Tuning knobs for {@link judgeQuad}. Deliberately exported: a reject only means
 * "ask the user", never "drop the file", so these are safe to loosen. The rate
 * of manual corner adjustment is the signal for whether they are right.
 */
/** Below this share of the frame, the contour is noise, not a page. */
export const MIN_AREA_RATIO = 0.25;
/** Above this, the "page" is the image border — i.e. nothing was found. */
export const MAX_AREA_RATIO = 0.98;
/** Corner angles outside this band mean the quad is not a rectangle in perspective. */
export const MIN_CORNER_ANGLE = 50;
export const MAX_CORNER_ANGLE = 130;
/** Max relative length difference between opposite edges before we distrust it. */
export const MAX_EDGE_IMBALANCE = 0.35;
/** Long edge of a cropped page. Matches the server-side vision downscale. */
export const DEFAULT_MAX_EDGE = 2200;
/** Long edge the source is normalised to before detection. */
export const SOURCE_MAX_EDGE = 2000;

/* ------------------------------------------------------------------ */
/* Pure geometry                                                       */
/* ------------------------------------------------------------------ */

/** Corners in clockwise order — the canonical traversal for every helper here. */
function corners(q: Quad): [Pt, Pt, Pt, Pt] {
  return [q.topLeft, q.topRight, q.bottomRight, q.bottomLeft];
}

function distance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Edge lengths, named by the side of the quad they span. */
export function quadEdges(q: Quad): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  return {
    top: distance(q.topLeft, q.topRight),
    right: distance(q.topRight, q.bottomRight),
    bottom: distance(q.bottomRight, q.bottomLeft),
    left: distance(q.bottomLeft, q.topLeft),
  };
}

/** Area via the shoelace formula. Always non-negative. */
export function quadArea(q: Quad): number {
  const p = corners(q);
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const a = p[i];
    const b = p[(i + 1) % 4];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * True when the quad is a simple convex polygon — every turn goes the same way.
 * A self-intersecting "bowtie" (which happens when the detector mislabels two
 * corners) fails here, and warping to it produces garbage.
 */
export function isConvex(q: Quad): boolean {
  const p = corners(q);
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const o = p[i];
    const a = p[(i + 1) % 4];
    const b = p[(i + 2) % 4];
    const cross = (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    if (Math.abs(cross) < 1e-9) continue; // collinear corner — no information
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return sign !== 0; // all-collinear is degenerate, not convex
}

/** Interior angle at each corner, in degrees, clockwise from top-left. */
export function cornerAngles(q: Quad): number[] {
  const p = corners(q);
  return p.map((cur, i) => {
    const prev = p[(i + 3) % 4];
    const next = p[(i + 1) % 4];
    const v1 = { x: prev.x - cur.x, y: prev.y - cur.y };
    const v2 = { x: next.x - cur.x, y: next.y - cur.y };
    const m1 = Math.hypot(v1.x, v1.y);
    const m2 = Math.hypot(v2.x, v2.y);
    if (m1 === 0 || m2 === 0) return 0;
    const cos = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / (m1 * m2)));
    return (Math.acos(cos) * 180) / Math.PI;
  });
}

/**
 * How unevenly matched the opposite edges are, 0 (perfect) to 1. Perspective
 * makes the far edge genuinely shorter than the near one, so a moderate value is
 * normal for an angled photo; a large one means the quad spans two pages, a
 * fold, or a shadow rather than one sheet.
 */
export function edgeImbalance(q: Quad): number {
  const e = quadEdges(q);
  const h = Math.max(e.top, e.bottom);
  const v = Math.max(e.left, e.right);
  const horizontal = h > 0 ? Math.abs(e.top - e.bottom) / h : 1;
  const vertical = v > 0 ? Math.abs(e.left - e.right) / v : 1;
  return Math.max(horizontal, vertical);
}

/**
 * Decide whether a quad can be cropped to without asking the user. Pure, so the
 * thresholds are testable against fixtures without a browser.
 */
export function judgeQuad(quad: Quad, frame: Frame): RejectReason | null {
  const frameArea = frame.width * frame.height;
  if (!(frameArea > 0)) return "no-contour";
  if (!isConvex(quad)) return "not-convex";
  const angles = cornerAngles(quad);
  if (angles.some((a) => a < MIN_CORNER_ANGLE || a > MAX_CORNER_ANGLE)) {
    return "not-convex";
  }
  const ratio = quadArea(quad) / frameArea;
  if (ratio < MIN_AREA_RATIO) return "too-small";
  if (ratio > MAX_AREA_RATIO) return "full-frame";
  if (edgeImbalance(quad) > MAX_EDGE_IMBALANCE) return "skewed";
  return null;
}

/**
 * Output size for a cropped page, DERIVED from the quad rather than fixed.
 *
 * This is the fix for the squash bug in the original scanner, which warped every
 * detected quad into a hardcoded 1200×1600 portrait: a landscape run ticket came
 * out stretched along one axis, damaging the text before the model ever saw it.
 * Averaging the opposite edges preserves the page's real aspect ratio. Never
 * upscales — a small crop stays small rather than being interpolated up.
 */
export function quadOutputSize(
  quad: Quad,
  maxEdge = DEFAULT_MAX_EDGE
): { width: number; height: number } {
  const e = quadEdges(quad);
  const w = (e.top + e.bottom) / 2;
  const h = (e.left + e.right) / 2;
  if (!(w > 0) || !(h > 0)) return { width: 1, height: 1 };
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/**
 * A sensible starting rectangle for manual adjustment, inset from the frame
 * edges. Used when detection fails — better to hand the user four handles near
 * where the page probably is than a wrong quad they have to undo.
 */
export function defaultQuad(frame: Frame, inset = 0.08): Quad {
  const dx = frame.width * inset;
  const dy = frame.height * inset;
  return {
    topLeft: { x: dx, y: dy },
    topRight: { x: frame.width - dx, y: dy },
    bottomRight: { x: frame.width - dx, y: frame.height - dy },
    bottomLeft: { x: dx, y: frame.height - dy },
  };
}

/** Clamp a quad's corners inside the frame, for drag handling. */
export function clampQuad(quad: Quad, frame: Frame): Quad {
  const fix = (p: Pt): Pt => ({
    x: Math.min(Math.max(p.x, 0), frame.width),
    y: Math.min(Math.max(p.y, 0), frame.height),
  });
  return {
    topLeft: fix(quad.topLeft),
    topRight: fix(quad.topRight),
    bottomRight: fix(quad.bottomRight),
    bottomLeft: fix(quad.bottomLeft),
  };
}

/** Our clockwise `Quad` → the corner names jscanify's `extractPaper` expects. */
export function toCornerPoints(quad: Quad): CornerPoints {
  return {
    topLeftCorner: quad.topLeft,
    topRightCorner: quad.topRight,
    bottomLeftCorner: quad.bottomLeft,
    bottomRightCorner: quad.bottomRight,
  };
}

/** jscanify's (possibly incomplete) detection → a `Quad`, or null if any corner is missing. */
function fromDetectedCorners(c: {
  topLeftCorner?: Pt;
  topRightCorner?: Pt;
  bottomLeftCorner?: Pt;
  bottomRightCorner?: Pt;
}): Quad | null {
  const { topLeftCorner: tl, topRightCorner: tr, bottomRightCorner: br, bottomLeftCorner: bl } = c;
  if (!tl || !tr || !br || !bl) return null;
  return {
    topLeft: { x: tl.x, y: tl.y },
    topRight: { x: tr.x, y: tr.y },
    bottomRight: { x: br.x, y: br.y },
    bottomLeft: { x: bl.x, y: bl.y },
  };
}

/* ------------------------------------------------------------------ */
/* OpenCV / DOM                                                        */
/* ------------------------------------------------------------------ */

/**
 * Find the page in `canvas` and judge the result. Never throws — a detector
 * failure degrades to `{quad: null, reject: "no-contour"}` so the caller falls
 * back to manual adjustment instead of losing the upload.
 */
export function detectPage(canvas: HTMLCanvasElement, scanner: Jscanify): Detection {
  const frame = { width: canvas.width, height: canvas.height };
  const miss: Detection = { quad: null, reject: "no-contour", frame };

  // landing: no OpenCV Mat to read the canvas into; the stand-in scanner
  // takes the canvas itself. Judging the quad is unchanged.
  try {
    const contour = scanner.findPaperContour(canvas);
    if (!contour) return miss;
    const quad = fromDetectedCorners(scanner.getCornerPoints(contour));
    if (!quad) return miss;
    return { quad, reject: judgeQuad(quad, frame), frame };
  } catch {
    return miss;
  }
}

/**
 * Perspective-correct `canvas` to `quad`, at the quad's own aspect ratio.
 * Returns null if the warp fails, so the caller can fall back to the original.
 */
export function cropToQuad(
  canvas: HTMLCanvasElement,
  quad: Quad,
  scanner: Jscanify,
  maxEdge = DEFAULT_MAX_EDGE
): HTMLCanvasElement | null {
  const { width, height } = quadOutputSize(quad, maxEdge);
  try {
    return scanner.extractPaper(canvas, width, height, toCornerPoints(quad));
  } catch {
    return null;
  }
}

/** Rotate a canvas by a multiple of 90°, returning a new canvas. */
export function rotateCanvas(
  canvas: HTMLCanvasElement,
  degrees: 0 | 90 | 180 | 270
): HTMLCanvasElement {
  if (degrees === 0) return canvas;
  const swap = degrees === 90 || degrees === 270;
  const out = document.createElement("canvas");
  out.width = swap ? canvas.height : canvas.width;
  out.height = swap ? canvas.width : canvas.height;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return out;
}

/** Human-readable reason, for the review modal's hint line. */
export function describeReject(reason: RejectReason): string {
  switch (reason) {
    case "no-contour":
      return "Couldn't find the page — drag the corners to its edges.";
    case "too-small":
      return "The page looks small in frame — check the corners.";
    case "full-frame":
      return "No page edge found — drag the corners to the page.";
    case "not-convex":
      return "The detected shape isn't a page — drag the corners to its edges.";
    case "skewed":
      return "This may span two pages — drag the corners to just one.";
  }
}
