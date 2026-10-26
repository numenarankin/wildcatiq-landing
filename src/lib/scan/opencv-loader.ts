/**
 * landing: stand-in for the app's `lib/scan/opencv-loader.ts`, which injects
 * OpenCV.js (~8.6 MB of wasm) and the jscanify client. Neither is installed
 * here. A product screen draws its own photo and knows where the sheet sits in
 * it, so it stages that page outline with `stageDetectedPage` and the scanner
 * this loader hands back "finds" it, the way jscanify finds the paper's
 * contour in a real photo. The method names and corner shape follow jscanify's
 * client API so `lib/scan/crop.ts` reads it unchanged.
 */

export interface Pt {
  x: number;
  y: number;
}

/** jscanify's corner names. */
export interface CornerPoints {
  topLeftCorner: Pt;
  topRightCorner: Pt;
  bottomLeftCorner: Pt;
  bottomRightCorner: Pt;
}

/** The detected paper contour: here, the staged corners as 0 to 1 fractions of the frame. */
export interface PaperContour {
  relative: CornerPoints;
  width: number;
  height: number;
}

/** The slice of jscanify's client the crop engine calls. */
export interface Jscanify {
  findPaperContour(canvas: HTMLCanvasElement): PaperContour | null;
  getCornerPoints(contour: PaperContour): Partial<CornerPoints>;
  extractPaper(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    corners: CornerPoints,
  ): HTMLCanvasElement;
}

let staged: CornerPoints | null = null;

/** Set the page the scanner will find, as 0 to 1 fractions of the photo's width and height. */
export function stageDetectedPage(corners: CornerPoints | null): void {
  staged = corners;
}

const scanner: Jscanify = {
  findPaperContour(canvas) {
    return staged ? { relative: staged, width: canvas.width, height: canvas.height } : null;
  },
  getCornerPoints({ relative, width, height }) {
    const at = (p: Pt): Pt => ({ x: p.x * width, y: p.y * height });
    return {
      topLeftCorner: at(relative.topLeftCorner),
      topRightCorner: at(relative.topRightCorner),
      bottomLeftCorner: at(relative.bottomLeftCorner),
      bottomRightCorner: at(relative.bottomRightCorner),
    };
  },
  extractPaper() {
    // No perspective warp without OpenCV; `cropToQuad` catches this and the
    // upload falls back to the whole frame, as the app does on a failed warp.
    throw new Error("landing: no OpenCV");
  },
};

export function loadScanner(): Promise<Jscanify> {
  return Promise.resolve(scanner);
}

export function warmScanner(): void {}
