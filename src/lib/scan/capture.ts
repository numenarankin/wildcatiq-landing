/**
 * Small DOM helpers for turning camera/image sources into compressed JPEG blobs
 * and (with jsPDF) a single multi-page PDF. Kept separate from the scan modal so
 * the pure image → PDF step stays unit-testable.
 *
 * Client-only.
 */

/** Anything we can rasterise into a working canvas. */
export type CanvasSource =
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement;

/** Intrinsic pixel size of a source, whatever kind it is. */
function sourceSize(source: CanvasSource): { sw: number; sh: number } {
  if (source instanceof HTMLVideoElement) {
    return { sw: source.videoWidth, sh: source.videoHeight };
  }
  if (source instanceof HTMLCanvasElement) {
    return { sw: source.width, sh: source.height };
  }
  return { sw: source.naturalWidth, sh: source.naturalHeight };
}

/** Draw a source (video frame, image, or canvas) onto a canvas, capping the long edge. */
export function drawToCanvas(
  source: CanvasSource,
  maxEdge = 2000
): HTMLCanvasElement {
  const { sw, sh } = sourceSize(source);
  const scale = Math.min(1, maxEdge / Math.max(sw, sh || 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Encode a canvas to a JPEG blob (phone photos are large — compress hard). */
export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Failed to encode image")),
      "image/jpeg",
      quality
    );
  });
}

/**
 * Decode a blob into an HTMLImageElement. Rejects on formats the browser can't
 * decode — notably HEIC, which iPhones still produce and which only the server
 * (via `heic-convert`) can read. Callers treat a rejection as "pass this file
 * through untouched" rather than an error.
 */
export function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}


// landing: `pagesToPdf` is left out; it needs jsPDF, which is not installed,
// and only the camera scanner's multi-page PDF calls it.

/** A stable filename for a scan session, e.g. `scan-2026-07-07.pdf`. */
export function scanFilename(isoDate: string): string {
  return `scan-${isoDate}.pdf`;
}
