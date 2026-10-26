"use client";

/**
 * The tank page's upload, at the crop check: the app's `CropReviewModal` over
 * a phone photo of Smith T201's handwritten gauge sheet, the detected page
 * outlined with its four corner handles.
 *
 * The photo is drawn here at runtime (a desk, the sheet turned a few degrees
 * and foreshortened as a handheld shot leaves it, the edge of the next page
 * in the binder) and handed to the modal as the JPEG `File` an upload would
 * carry. The gauges on it are the ones the rest of the Documents page reads
 * off this sheet. Detection is the one stand-in: the landing has no OpenCV, so
 * the scanner is told where the sheet was drawn (`stageDetectedPage`) and
 * finds exactly that.
 */
import { useEffect, useState } from "react";
import { Caveat } from "next/font/google";
import { CropReviewModal } from "@/components/scan/crop-review-modal";
import { stageDetectedPage, type CornerPoints, type Pt } from "@/lib/scan/opencv-loader";
import { feetInches, smithWeekGauges } from "@/lib/screens/documents-tanks";
import { ScreenPanel } from "../../panel";

const pen = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

const FILE_NAME = "smith-t201-gauge-sheet-2026-10.jpg";

/** A phone photo held sideways. */
const PHOTO_W = 2000;
const PHOTO_H = 1500;
/** The sheet before it is placed in the photo (letter proportions). */
const SHEET_W = 1000;
const SHEET_H = 1290;
/** How far the sheet is turned, and how much shorter its far (top) edge reads. */
const TILT_DEG = 6;
const FAR_EDGE = 0.93;
const CENTER: Pt = { x: 960, y: 752 };

/** Deterministic jitter, so the handwriting is the same on every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** The sheet's corners in the photo. */
function sheetCorners(): CornerPoints {
  const a = (TILT_DEG * Math.PI) / 180;
  const place = (x: number, y: number): Pt => ({
    x: CENTER.x + x * Math.cos(a) - y * Math.sin(a),
    y: CENTER.y + x * Math.sin(a) + y * Math.cos(a),
  });
  const hw = SHEET_W / 2;
  const hh = SHEET_H / 2;
  return {
    topLeftCorner: place(-hw * FAR_EDGE, -hh),
    topRightCorner: place(hw * FAR_EDGE, -hh),
    bottomRightCorner: place(hw, hh),
    bottomLeftCorner: place(-hw, hh),
  };
}

/** The flat gauge sheet: ruled table, written in pen. */
function drawSheet(family: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SHEET_W;
  c.height = SHEET_H;
  const ctx = c.getContext("2d")!;
  const rnd = seeded(7);

  ctx.fillStyle = "#f6f1e4";
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  // Paper tooth.
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(120,100,70,${0.03 + rnd() * 0.05})`;
    ctx.fillRect(rnd() * SHEET_W, rnd() * SHEET_H, 1.5, 1.5);
  }
  // Binder holes down the left.
  ctx.fillStyle = "#6f5434";
  for (const y of [180, 645, 1110]) {
    ctx.beginPath();
    ctx.arc(42, y, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  const left = 110;
  const right = SHEET_W - 60;
  const cols = [left, 400, 600, 770, right];
  const top = 230;
  const rowH = 74;
  const rows = 13;

  // Printed rules.
  ctx.strokeStyle = "rgba(70,110,160,0.55)";
  ctx.lineWidth = 2;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(left, top + r * rowH);
    ctx.lineTo(right, top + r * rowH);
    ctx.stroke();
  }
  for (const x of cols) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + rows * rowH);
    ctx.stroke();
  }

  const write = (text: string, x: number, y: number, size: number, weight = 500) => {
    ctx.save();
    ctx.translate(x + (rnd() - 0.5) * 6, y + (rnd() - 0.5) * 5);
    ctx.rotate(((rnd() - 0.5) * 2.4 * Math.PI) / 180);
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = "#1e3a7b";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  write("SMITH T201 GAUGE SHEET  OCT 2026", left, 150, 62, 700);
  ctx.strokeStyle = "#1e3a7b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left, 168);
  ctx.quadraticCurveTo(left + 400, 176, left + 760, 164);
  ctx.stroke();

  const heads = ["Date", "Time", "Ft", "In"];
  heads.forEach((h, i) => write(h, cols[i] + 22, top + rowH - 20, 50, 700));

  smithWeekGauges().forEach((g, i) => {
    const y = top + (i + 2) * rowH - 20;
    const [, m, d] = g.date.split("-");
    const { ft, in: inches } = feetInches(g.gaugeIn);
    const [hh, mm] = g.time.split(":");
    write(`${Number(m)}/${Number(d)}`, cols[0] + 26, y, 52);
    write(`${Number(hh)}:${mm}`, cols[1] + 26, y, 52);
    write(String(ft), cols[2] + 50, y, 52);
    write(String(inches), cols[3] + 40, y, 52);
  });
  write("L.O.", right - 120, top + rows * rowH + 70, 48);
  return c;
}

/** Map the flat sheet onto the photo's quad, cell by cell. */
function warpOnto(ctx: CanvasRenderingContext2D, sheet: HTMLCanvasElement, q: CornerPoints) {
  const at = (u: number, v: number): Pt => {
    const top = { x: q.topLeftCorner.x + (q.topRightCorner.x - q.topLeftCorner.x) * u, y: q.topLeftCorner.y + (q.topRightCorner.y - q.topLeftCorner.y) * u };
    const bot = { x: q.bottomLeftCorner.x + (q.bottomRightCorner.x - q.bottomLeftCorner.x) * u, y: q.bottomLeftCorner.y + (q.bottomRightCorner.y - q.bottomLeftCorner.y) * u };
    return { x: top.x + (bot.x - top.x) * v, y: top.y + (bot.y - top.y) * v };
  };
  const N = 24;
  const tri = (s: [Pt, Pt, Pt], d: [Pt, Pt, Pt]) => {
    // Affine map taking source triangle s to destination d.
    const [s0, s1, s2] = s;
    const [d0, d1, d2] = d;
    const den = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
    const a = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / den;
    const b = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / den;
    const c = ((d2.x - d0.x) * (s1.x - s0.x) - (d1.x - d0.x) * (s2.x - s0.x)) / den;
    const dd = ((d2.y - d0.y) * (s1.x - s0.x) - (d1.y - d0.y) * (s2.x - s0.x)) / den;
    const e = d0.x - a * s0.x - c * s0.y;
    const f = d0.y - b * s0.x - dd * s0.y;
    ctx.save();
    // Grow the clip a hair past each edge so the cells meet without seams.
    const cx = (d0.x + d1.x + d2.x) / 3;
    const cy = (d0.y + d1.y + d2.y) / 3;
    const grow = (p: Pt): Pt => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const len = Math.hypot(dx, dy) || 1;
      return { x: p.x + (dx / len) * 1.2, y: p.y + (dy / len) * 1.2 };
    };
    const [g0, g1, g2] = [grow(d0), grow(d1), grow(d2)];
    ctx.beginPath();
    ctx.moveTo(g0.x, g0.y);
    ctx.lineTo(g1.x, g1.y);
    ctx.lineTo(g2.x, g2.y);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(a, b, c, dd, e, f);
    ctx.drawImage(sheet, 0, 0);
    ctx.restore();
  };
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const u0 = i / N;
      const u1 = (i + 1) / N;
      const v0 = j / N;
      const v1 = (j + 1) / N;
      const s = (u: number, v: number): Pt => ({ x: u * SHEET_W, y: v * SHEET_H });
      tri([s(u0, v0), s(u1, v0), s(u1, v1)], [at(u0, v0), at(u1, v0), at(u1, v1)]);
      tri([s(u0, v0), s(u1, v1), s(u0, v1)], [at(u0, v0), at(u1, v1), at(u0, v1)]);
    }
  }
}

function polygon(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/** The whole photo, as the JPEG a phone upload carries. */
async function shootPhoto(family: string): Promise<File> {
  const c = document.createElement("canvas");
  c.width = PHOTO_W;
  c.height = PHOTO_H;
  const ctx = c.getContext("2d")!;
  const rnd = seeded(31);

  // Desk: worn oak.
  const desk = ctx.createLinearGradient(0, 0, PHOTO_W, PHOTO_H);
  desk.addColorStop(0, "#8b6a45");
  desk.addColorStop(1, "#6e5134");
  ctx.fillStyle = desk;
  ctx.fillRect(0, 0, PHOTO_W, PHOTO_H);
  for (let i = 0; i < 90; i++) {
    const y = rnd() * PHOTO_H;
    ctx.strokeStyle = `rgba(${rnd() < 0.5 ? "60,40,20" : "170,135,95"},${0.08 + rnd() * 0.12})`;
    ctx.lineWidth = 1 + rnd() * 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(PHOTO_W * 0.3, y + (rnd() - 0.5) * 40, PHOTO_W * 0.7, y + (rnd() - 0.5) * 40, PHOTO_W, y + (rnd() - 0.5) * 30);
    ctx.stroke();
  }

  // The next page in the binder, its edge just in frame on the right.
  const next: Pt[] = [
    { x: 1795, y: -40 },
    { x: 2100, y: -60 },
    { x: 2100, y: 1560 },
    { x: 1740, y: 1560 },
  ];
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#ece6d6";
  polygon(ctx, next);
  ctx.fill();
  ctx.restore();
  ctx.save();
  polygon(ctx, next);
  ctx.clip();
  ctx.strokeStyle = "rgba(70,110,160,0.5)";
  ctx.lineWidth = 2;
  for (let y = 210; y < PHOTO_H; y += 70) {
    ctx.beginPath();
    ctx.moveTo(1700, y + 6);
    ctx.lineTo(2100, y - 6);
    ctx.stroke();
  }
  ctx.font = `700 60px ${family}`;
  ctx.fillStyle = "#1e3a7b";
  ctx.fillText("SMITH T2", 1830, 140);
  ctx.font = `500 50px ${family}`;
  for (let r = 0; r < 7; r++) ctx.fillText(`10/${20 + r}`, 1832 - r * 3, 335 + r * 70);
  ctx.restore();

  // The sheet, with its shadow on the desk.
  const q = sheetCorners();
  const outline = [q.topLeftCorner, q.topRightCorner, q.bottomRightCorner, q.bottomLeftCorner];
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 14;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#f6f1e4";
  polygon(ctx, outline);
  ctx.fill();
  ctx.restore();
  warpOnto(ctx, drawSheet(family), q);

  // Room light: brighter at the top left, falling off to the corners.
  const light = ctx.createRadialGradient(700, 420, 200, 1000, 750, 1400);
  light.addColorStop(0, "rgba(255,248,230,0.10)");
  light.addColorStop(1, "rgba(20,12,4,0.32)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, PHOTO_W, PHOTO_H);

  stageDetectedPage({
    topLeftCorner: { x: q.topLeftCorner.x / PHOTO_W, y: q.topLeftCorner.y / PHOTO_H },
    topRightCorner: { x: q.topRightCorner.x / PHOTO_W, y: q.topRightCorner.y / PHOTO_H },
    bottomRightCorner: { x: q.bottomRightCorner.x / PHOTO_W, y: q.bottomRightCorner.y / PHOTO_H },
    bottomLeftCorner: { x: q.bottomLeftCorner.x / PHOTO_W, y: q.bottomLeftCorner.y / PHOTO_H },
  });

  const blob = await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.88),
  );
  return new File([blob], FILE_NAME, { type: "image/jpeg" });
}

const noop = () => {};

export function DocumentsCropScreen() {
  const [files, setFiles] = useState<File[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const family = pen.style.fontFamily;
    (async () => {
      try {
        await Promise.all([document.fonts.load(`500 52px ${family}`), document.fonts.load(`700 62px ${family}`)]);
      } catch {
        // The fallback face still reads as a photo of a sheet.
      }
      const file = await shootPhoto(family);
      if (!cancelled) setFiles([file]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScreenPanel w={1200} h={720} path="/production/wells/w-s4">
      {files ? <CropReviewModal files={files} onCancel={noop} onConfirm={noop} /> : null}
    </ScreenPanel>
  );
}
