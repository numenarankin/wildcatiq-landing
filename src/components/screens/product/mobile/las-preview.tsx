"use client";

/**
 * A LAS opened on the phone, transcribed from wildcat-phone:
 * - src/components/files/las-preview.tsx (`LasLog`: MetaBar, track picker and
 *   scale selector, TrackHeader, depth chunks with the pinned depth column;
 *   DEPTH_W 52, TRACK_MIN_W 260, 1:600 = 0.24 pt/ft, 500 ft chunks)
 * - src/lib/las/las-tracks.ts (`planTracks`: GR track green on 0-150, the
 *   "GR / SP / Caliper" label, Res and Por tracks behind the picker)
 * - src/lib/las/las-render.ts (`chunkGeometry` min/max/mid per pixel row and
 *   `depthTicks`, ported verbatim below)
 * - src/components/files/file-preview-modal.tsx on src/components/ui/modal.tsx
 *   (the centred SwipeUpModal card it opens in from a well's Files tab: title
 *   is the file name, description the well, Download outline button, close X;
 *   the preview box is 66% of the window high)
 *
 * The track width is the window's, as the RN computes it
 * (`useWindowDimensions`), so the track runs under the card's right edge
 * exactly as it does on a 390pt phone. The log is the synthetic Smith 4 run
 * in mobile-b-fixture.ts.
 */
import { Download, X } from "lucide-react";
import { smith4Las, LAS_FILE_NAME, LAS_WELL } from "@/lib/screens/mobile-b-fixture";
import { AppHeader, C, CONTENT_TOP, LABEL, MONO, PhoneFrame } from "./phone";

const DEPTH_W = 52;
const TRACK_MIN_W = 260;
const PT_PER_FT = 0.24;
const FEET_PER_CHUNK = 500;
const WIN_W = 390;
const WIN_H = 844;

const GR_PLOT = { mnemonic: "GR", unit: "API", color: "#2e7d32", domain: [0, 150] as [number, number] };

/* ---- las-render.ts, verbatim for a linear plot ------------------------- */

const MIN_TICK_GAP = 48;
const TICK_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const fmt = (v: number) => String(Math.round(v * 100) / 100);

function depthTicks(top: number, bottom: number, height: number): { depth: number; y: number }[] {
  const span = bottom - top;
  if (!(span > 0) || !(height > 0)) return [];
  const minFeet = MIN_TICK_GAP * (span / height);
  const step = TICK_STEPS.find((s) => s >= minFeet) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const ticks: { depth: number; y: number }[] = [];
  for (let d = Math.ceil(top / step) * step; d <= bottom; d += step) ticks.push({ depth: d, y: ((d - top) / span) * height });
  return ticks;
}

function chunkPaths(depths: number[], values: number[], win: [number, number], width: number, height: number): { line: string; band: string } {
  const [top, bottom] = win;
  const span = bottom - top;
  const lastRow = Math.max(0, Math.ceil(height) - 1);
  const [lo, hi] = GR_PLOT.domain;
  const toX = (v: number) => clamp(((v - lo) / (hi - lo)) * width, 0, width);
  const run: { y: number; min: number; max: number; mid: number }[] = [];
  let row = -1;
  let bucket: { min: number; max: number; sum: number; n: number } | null = null;
  const flush = () => {
    if (!bucket) return;
    run.push({ y: Math.min(row + 0.5, height), min: bucket.min, max: bucket.max, mid: bucket.sum / bucket.n });
    bucket = null;
  };
  for (let i = 0; i < depths.length; i++) {
    const d = depths[i];
    if (d < top || d > bottom) continue;
    const x = toX(values[i]);
    const r = clamp(Math.floor(((d - top) / span) * height), 0, lastRow);
    if (bucket && r !== row) flush();
    row = r;
    if (!bucket) bucket = { min: x, max: x, sum: x, n: 1 };
    else {
      bucket.min = Math.min(bucket.min, x);
      bucket.max = Math.max(bucket.max, x);
      bucket.sum += x;
      bucket.n++;
    }
  }
  flush();
  const line = run.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(p.mid)} ${fmt(p.y)}`).join(" ");
  const spread = run.some((p) => p.min !== p.max);
  const band = spread
    ? `${run.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(p.max)} ${fmt(p.y)}`).join(" ")} ${[...run]
        .reverse()
        .map((p) => `L${fmt(p.min)} ${fmt(p.y)}`)
        .join(" ")} Z`
    : "";
  return { line, band };
}

/* ------------------------------------------------------------------------ */

function Segmented({ options, value }: { options: string[]; value: string }) {
  return (
    <div style={{ display: "flex", alignSelf: "flex-start", background: C.muted, borderRadius: 6, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <div
            key={o}
            style={{
              padding: "0 10px",
              minHeight: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              background: active ? C.background : "transparent",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : undefined,
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 12, color: active ? C.foreground : C.mutedFg, whiteSpace: "nowrap" }}>{o}</span>
          </div>
        );
      })}
    </div>
  );
}

function axisLabel(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 100 || v === 0) return String(Math.round(v));
  return String(Math.round(v * 100) / 100);
}

function LasLog() {
  const las = smith4Las();
  const [depths, gr] = [las.data[0], las.data[1]];
  const trackArea = Math.max(TRACK_MIN_W, WIN_W - DEPTH_W);
  const perRow = Math.max(1, Math.floor(trackArea / TRACK_MIN_W));
  const trackW = trackArea / perRow;
  const chunkH = Math.round(FEET_PER_CHUNK * PT_PER_FT);
  const chunks: [number, number][] = [];
  const total = las.depth.stop - las.depth.start;
  for (let i = 0; i < Math.ceil(total / FEET_PER_CHUNK); i++) {
    chunks.push([las.depth.start + i * FEET_PER_CHUNK, Math.min(las.depth.start + (i + 1) * FEET_PER_CHUNK, las.depth.stop)]);
  }
  // FlatList initialNumToRender 3, windowSize 5: what is on screen is drawn.
  const shown = chunks.slice(0, 5);
  const muted: React.CSSProperties = { ...LABEL, color: C.tertiaryText };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.background }}>
      {/* MetaBar: one line, the well and the interval logged */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px", borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <span style={{ ...LABEL, fontFamily: "var(--font-sans), system-ui, sans-serif", fontWeight: 500, color: C.mutedFg }}>{las.well.WELL}</span>
          <span style={muted}>{`${Math.round(las.depth.start)}-${Math.round(las.depth.stop)} ${las.depth.unit}`}</span>
        </div>
      </div>

      {/* Controls: the track picker (three tracks, one fits) and the scale */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px" }}>
        <Segmented options={["GR", "Res", "Por"]} value="GR" />
        <Segmented options={["1:240", "1:600", "Fit"]} value="1:600" />
      </div>

      {/* TrackHeader */}
      <div style={{ display: "flex", paddingTop: 8, paddingBottom: 6, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ width: DEPTH_W, padding: "0 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={muted}>{las.depth.unit}</span>
        </div>
        <div style={{ width: trackW, flexShrink: 0, padding: "0 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ ...LABEL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>GR / SP / Caliper</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 2, borderRadius: 1, background: GR_PLOT.color }} />
              <span style={muted}>{GR_PLOT.mnemonic}</span>
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={muted}>{axisLabel(GR_PLOT.domain[0])}</span>
            <span style={muted}>{GR_PLOT.unit}</span>
            <span style={muted}>{axisLabel(GR_PLOT.domain[1])}</span>
          </div>
        </div>
      </div>

      {/* The depth chunks */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {shown.map((win) => {
          const ticks = depthTicks(win[0], win[1], chunkH);
          const { line, band } = chunkPaths(depths, gr, win, trackW, chunkH);
          return (
            <div key={win[0]} style={{ display: "flex", height: chunkH, background: "#ffffff" }}>
              <svg width={DEPTH_W} height={chunkH} style={{ flexShrink: 0, display: "block" }}>
                {ticks.map((t) => (
                  <text key={`${t.depth}-l`} x={DEPTH_W - 9} y={t.y - 2} textAnchor="end" fontSize={9} fontFamily={MONO} fill={C.tertiaryText}>
                    {String(Math.round(t.depth))}
                  </text>
                ))}
                {ticks.map((t) => (
                  <line key={`${t.depth}-t`} x1={DEPTH_W - 6} x2={DEPTH_W} y1={t.y} y2={t.y} stroke={C.border} strokeWidth={1} />
                ))}
                <line x1={DEPTH_W - 0.5} x2={DEPTH_W - 0.5} y1={0} y2={chunkH} stroke={C.border} strokeWidth={1} />
              </svg>
              <svg width={trackW} height={chunkH} style={{ flexShrink: 0, display: "block", borderRight: `0.5px solid ${C.border}` }}>
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1={trackW * f} x2={trackW * f} y1={0} y2={chunkH} stroke={C.border} strokeWidth={0.5} opacity={0.6} />
                ))}
                {ticks.map((t) => (
                  <line key={t.depth} x1={0} x2={trackW} y1={t.y} y2={t.y} stroke={C.border} strokeWidth={0.5} />
                ))}
                {band ? <path d={band} fill={GR_PLOT.color} fillOpacity={0.18} stroke="none" /> : null}
                <path d={line} stroke={GR_PLOT.color} strokeWidth={1} fill="none" />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The well page behind the modal: header and the rate line, under the scrim. */
function WellPageBehind() {
  return (
    <div style={{ padding: `${CONTENT_TOP - 54 + 20}px 26px 0` }}>
      <span style={{ fontWeight: 600, fontSize: 24, letterSpacing: -0.4 }}>{LAS_WELL.name}</span>
    </div>
  );
}

export function LasPreviewScreen() {
  const cardW = Math.min(896, WIN_W * 0.92);
  const previewH = Math.min(Math.round(WIN_H * 0.66), 760);
  return (
    <PhoneFrame time="7:41">
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10 }}>
        <AppHeader back />
      </div>
      <WellPageBehind />
      {/* SwipeUpModal: the scrim over the whole window, the card centred in it */}
      <div style={{ position: "absolute", top: -54, left: 0, right: 0, bottom: 0, zIndex: 20, background: "rgba(0,0,0,0.50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: cardW, borderRadius: 8, background: C.card, overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.25)", border: "0.5px solid rgba(10,10,10,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px", borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: -0.2, overflowWrap: "anywhere" }}>{LAS_FILE_NAME}</span>
              <span style={{ fontSize: 14, lineHeight: "20px", color: C.mutedFg }}>{LAS_WELL.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontWeight: 500, fontSize: 13 }}>
              <Download size={14} />
              Download
            </div>
            <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color={C.foreground} />
            </div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ height: previewH, border: `1px solid ${C.border}`, borderRadius: 2.4, background: "#ffffff", overflow: "hidden" }}>
              <LasLog />
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
