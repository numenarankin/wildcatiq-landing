"use client";

/**
 * Scanning paper into Files from the phone, played on a loop: Luis on the
 * Files page, the round Add button, Scan, the in-app camera over Brazos Bend's
 * two-page ticket for the Roy Corbett 4 rod job, a shot of each page with its
 * corners found and the page flattened, the review step where the pages
 * become one PDF and he names it, Save with the light going round it while it
 * uploads, then the scanner away, Files open on Scans with the PDF in it and
 * the "Scan filed" sheet over it. Transcribed from mobile-background:
 * - src/components/files/file-browser.tsx (+ app/(app)/files.tsx): the folder
 *   name as `pageTitle` beside the 44pt round black Add button; the compact
 *   rows under 560pt (icon cell 40, name in `tableCell` with folders in
 *   `cardTitle`'s medium, then type, size and date as a `caption` line; a file's
 *   kebab); the Add menu's New Folder, New Doc, Scan, Upload File. Its
 *   `handleScanned` is the flow: `DocumentScanner` with `format="pdf"`,
 *   `nameRequired` and `doneLabel="Save"`, `deliverScan(result, { folderId:
 *   SCANS_FOLDER, scan: false })` held open with `busy` until it lands, then
 *   `showScans()` and `success("Scan filed", "<name>.pdf · Scans")`.
 * - src/components/ui/slideup-menu.tsx on slideup-sheet.tsx (the card's 18
 *   corners, 8 padding, the 64 x 6 grabber, the title in `typography.label`,
 *   52pt rows of medium 17).
 * - src/components/scan/document-scanner.tsx: the camera (close, the page-count
 *   pill, the hint "Line up the document and tap to capture each page", the
 *   photo button, the 68pt shutter, the last page's 56 x 72 thumbnail with its
 *   remove dot and page number, the white Save pill that opens review), and
 *   `ReviewScreen` (the "2 pages" header, the "Document name" field with the
 *   timestamp name as placeholder, the 132pt page cards with rotate, move and
 *   delete, and the footer's Add pages beside the black Save, whose
 *   running-border.tsx light in `colors.info` turns while the caller files).
 * - src/components/scan/crop-step.tsx (Retake, Rotate, Use photo; 14pt corner
 *   dots on 1pt white edges), opening on the corners `detectQuad` finds in the
 *   still (`EDGE_DETECTION` on in src/lib/scan/detect-quad.ts), then
 *   src/lib/scan/warp.ts `warpPage` flattening the page: the thumbnail and the
 *   review cards show it square.
 * - src/lib/scan/capture.ts `defaultScanName`, src/lib/scan/ingest.ts
 *   (`deliverScan`, `SCANS_FOLDER_NAME`), src/hooks/use-files.ts (`formatSize`,
 *   `formatDate`), src/components/ui/success-sheet.tsx.
 *
 * The ticket and the tailgate it lies on are drawn here: the world in front of
 * the lens. What the ticket says is the job in `documents-fixture.ts` and
 * `invoice-fixture.ts`; the file it becomes is `SCANNED_TICKET` in Scans.
 */
import { ArrowRight, Camera, ChevronLeft, ChevronRight, FileText, Folder, Image as ImageIcon, MoreVertical, Plus, RotateCw, Trash2, X } from "lucide-react";
import { CORBETT_JOB, CORBETT_TICKET_NAME } from "@/lib/screens/documents-fixture";
import { FILES_ROOT, SCANNED_TICKET, SCAN_OPENED_AT } from "@/lib/screens/documents-files-fixture";
import { PROPERTY_PRINTED, TICKET_NO, VENDOR, ticketItems } from "@/lib/screens/invoice-fixture";
import { OPERATOR } from "@/lib/screens/operator";
import { AppHeader, C, LABEL, MONO, PhoneFrame, SANS, StatusBar } from "../mobile/phone";
import { BlinkCaret, IosKeyboard, KEYBOARD_EASE, KEYBOARD_H, KEYBOARD_MS, springCurve, useStepLoop, useTicker } from "../mobile/motion";

/* ------------------------------------------------------------------ *
 * The loop
 * ------------------------------------------------------------------ */

const STEPS = [
  1600, // 0 Files, at the top of the tree
  300, // 1 Add pressed
  1300, // 2 the Add menu up
  300, // 3 Scan pressed
  1400, // 4 the menu down, the camera slides up over page 1
  260, // 5 shutter
  1300, // 6 the crop: corners found on page 1
  220, // 7 Use photo
  1400, // 8 the camera: 1 page, flattened; page 2 turned up in front of the lens
  260, // 9 shutter
  1100, // 10 the crop on page 2
  220, // 11 Use photo
  1000, // 12 the camera: 2 pages
  220, // 13 Save pressed: the review step
  1200, // 14 review: two pages, the name to give
  2600, // 15 the name typed
  500, // 16 the keyboard down
  220, // 17 Save pressed
  2000, // 18 filing: the light round Save
  5000, // 19 the scanner away, Scans open, "Scan filed" (its 5 s auto-close)
  1600, // 20 the PDF in Scans
] as const;

const NAME = CORBETT_TICKET_NAME;
const KEY_MS = 85;
const MARK = "#1a71ff";

/** America/Chicago wall clock for an instant: what the phone in Graham shows. */
function local(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return parts as Record<"year" | "month" | "day" | "hour" | "minute" | "second", string>;
}
const filedAt = local(SCANNED_TICKET.createdAt!);
const STATUS_TIME = `${Number(filedAt.hour) % 12 || 12}:${filedAt.minute}`;
/** capture.ts `defaultScanName`, at the moment the scanner opened. */
const opened = local(SCAN_OPENED_AT);
const NAME_HINT = `scan-${opened.year}-${opened.month}-${opened.day}-${opened.hour}${opened.minute}${opened.second}`;
const FILE_NAME = `${NAME}.pdf`;

/* ------------------------------------------------------------------ *
 * The paper: Brazos Bend's ticket, two pages, in front of the lens
 * ------------------------------------------------------------------ */

const PAPER_W = 170;
const PAPER_H = 220;
const MDY = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};
const INK = "#1d1b18";
const FAINT = "#4a463f";

function PaperRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "0.6px solid #b9b3a6", padding: "2.6px 0 1.6px", alignItems: "baseline" }}>
      <span style={{ fontSize: 4.6, letterSpacing: 0.2, color: FAINT, textTransform: "uppercase", width: 34, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 5.8, fontWeight: 600, color: INK }}>{value}</span>
    </div>
  );
}

function PaperHead({ page }: { page: 1 | 2 }) {
  return (
    <>
      <div style={{ fontSize: 7.6, fontWeight: 600, letterSpacing: 0.4, textAlign: "center" }}>{VENDOR.name.toUpperCase()}</div>
      <div style={{ fontSize: 4.6, textAlign: "center", color: FAINT, marginTop: 1 }}>{`${VENDOR.address.join(" · ")} · ${VENDOR.phone}`}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 5.6 }}>
        <span style={{ letterSpacing: 0.6 }}>FIELD SERVICE TICKET</span>
        <span style={{ color: "#a3241b", fontWeight: 600 }}>No. {TICKET_NO}</span>
      </div>
      <div style={{ fontSize: 4.6, color: FAINT, textAlign: "right", marginTop: 1 }}>Page {page} of 2</div>
    </>
  );
}

const PAPER_STYLE: React.CSSProperties = {
  width: PAPER_W,
  height: PAPER_H,
  background: "linear-gradient(172deg, #f8f6ef 0%, #f0ece1 60%, #e8e2d4 100%)",
  padding: "10px 10px 8px",
  boxSizing: "border-box",
  fontFamily: MONO,
  color: INK,
  display: "flex",
  flexDirection: "column",
};

/** Page 1: the job, the well and what the crew found. */
function TicketFront() {
  const found = CORBETT_JOB.notes.replace(`Ticket ${TICKET_NO}. `, "");
  return (
    <div style={PAPER_STYLE}>
      <PaperHead page={1} />
      <div style={{ marginTop: 4, borderTop: `1px solid ${INK}` }}>
        <PaperRow label="Date" value={MDY(CORBETT_JOB.date)} />
        <PaperRow label="Customer" value={OPERATOR.name} />
        <PaperRow label="Lease / well" value={PROPERTY_PRINTED} />
        <PaperRow label="County" value={`${OPERATOR.county}, TX`} />
      </div>
      <div style={{ marginTop: 7, fontSize: 4.6, letterSpacing: 0.4, color: FAINT }}>WORK PERFORMED</div>
      <div style={{ marginTop: 2, fontSize: 5.6, lineHeight: 1.45, borderTop: "0.6px solid #b9b3a6", paddingTop: 2 }}>{CORBETT_JOB.job}.</div>
      <div style={{ fontSize: 5.6, lineHeight: 1.45 }}>{found}</div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 0.6, background: "#b9b3a6" }} />
        ))}
      </div>
    </div>
  );
}

/** Page 2: hours and materials as the crew wrote them, and the signatures. */
function TicketBack() {
  return (
    <div style={PAPER_STYLE}>
      <PaperHead page={2} />
      <div style={{ marginTop: 4, borderTop: `1px solid ${INK}`, display: "flex", justifyContent: "space-between", fontSize: 4.6, color: FAINT, padding: "2px 0" }}>
        <span>HOURS AND MATERIALS</span>
        <span>QTY</span>
      </div>
      {ticketItems().map((it) => (
        <div key={it.description} style={{ display: "flex", justifyContent: "space-between", gap: 6, borderTop: "0.6px solid #b9b3a6", padding: "2.4px 0 1.6px", alignItems: "baseline" }}>
          <span style={{ fontSize: 5, lineHeight: 1.35 }}>{it.description}</span>
          <span style={{ fontSize: 5.6, fontWeight: 600, whiteSpace: "nowrap" }}>{`${it.quantity} ${it.uom}`}</span>
        </div>
      ))}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 4.6, color: FAINT }}>
        <span>CREW _____________</span>
        <span>CUSTOMER _________</span>
      </div>
    </div>
  );
}

const PAGES = [TicketFront, TicketBack] as const;

/** The photo's frame (3:4 portrait) and where each page lies on the tailgate. */
const PHOTO_W = 300;
const PHOTO_H = 400;
const LIE = [
  { cx: 150, cy: 194, rot: -4 },
  { cx: 154, cy: 200, rot: 3 },
] as const;

/** A page's four corners in photo coordinates: where `detectQuad` puts the crop dots. */
function corners(page: 0 | 1) {
  const { cx, cy, rot } = LIE[page];
  const a = (rot * Math.PI) / 180;
  return [
    [-PAPER_W / 2, -PAPER_H / 2],
    [PAPER_W / 2, -PAPER_H / 2],
    [PAPER_W / 2, PAPER_H / 2],
    [-PAPER_W / 2, PAPER_H / 2],
  ].map(([x, y]) => ({ x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) }));
}

/** A tailgate in the morning, with the page on it. */
function Scene({ page }: { page: 0 | 1 }) {
  const Paper = PAGES[page];
  const { cx, cy, rot } = LIE[page];
  return (
    <div style={{ position: "relative", width: PHOTO_W, height: PHOTO_H, overflow: "hidden", background: "linear-gradient(180deg, #5b5f63 0%, #44484c 55%, #2f3235 100%)" }}>
      {/* the tailgate's pressed ribs */}
      {[60, 130, 200, 270, 340].map((y) => (
        <div key={y} style={{ position: "absolute", left: -10, right: -10, top: y, height: 10, background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.25))", transform: "rotate(-1.5deg)" }} />
      ))}
      <div style={{ position: "absolute", left: cx - PAPER_W / 2, top: cy - PAPER_H / 2, transform: `rotate(${rot}deg)`, boxShadow: "5px 9px 16px rgba(0,0,0,0.45)" }}>
        <Paper />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,246,225,0.12) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.2) 100%)" }} />
    </div>
  );
}

/** The scene scaled into a box: `cover` for the viewfinder, `contain` for the shot. */
function Photo({ w, h, fit, page }: { w: number; h: number; fit: "cover" | "contain"; page: 0 | 1 }) {
  const s = fit === "cover" ? Math.max(w / PHOTO_W, h / PHOTO_H) : Math.min(w / PHOTO_W, h / PHOTO_H);
  return (
    <div style={{ position: "absolute", left: (w - PHOTO_W * s) / 2, top: (h - PHOTO_H * s) / 2, width: PHOTO_W, height: PHOTO_H, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <Scene page={page} />
    </div>
  );
}

/** A flattened page (what `warpPage` leaves) fitted into a box, `cover` as the app's Image does. */
function Flat({ page, w, h }: { page: 0 | 1; w: number; h: number }) {
  const Paper = PAGES[page];
  const s = Math.max(w / PAPER_W, h / PAPER_H);
  return (
    <div style={{ position: "absolute", left: (w - PAPER_W * s) / 2, top: (h - PAPER_H * s) / 2, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <Paper />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Files
 * ------------------------------------------------------------------ */

/** theme.ts `typography.caption` in `tertiaryText`. */
const CAPTION: React.CSSProperties = { fontFamily: SANS, fontSize: 11, lineHeight: "16px", color: C.tertiaryText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const NAME_TEXT: React.CSSProperties = { fontFamily: SANS, fontSize: 15, color: C.foreground, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

function Row({ icon, name, meta, folder, kebab }: { icon: React.ReactNode; name: string; meta: string; folder: boolean; kebab: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", minHeight: 64, padding: "12px 0", boxSizing: "border-box", borderBottom: `0.5px solid ${C.border}` }}>
      <div style={{ width: 40, paddingLeft: 4, display: "flex" }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 8, display: "flex", flexDirection: "column" }}>
        <span style={{ ...NAME_TEXT, fontWeight: folder ? 500 : 400 }}>{name}</span>
        {meta ? <span style={CAPTION}>{meta}</span> : null}
      </div>
      <div style={{ width: 56, display: "flex", justifyContent: "flex-end" }}>
        {kebab ? (
          <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
            <MoreVertical size={16} color={C.foreground} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The browser on one folder: its name as the title, the Add button, its rows. */
function FilesPage({ inScans, addPressed }: { inScans: boolean; addPressed: boolean }) {
  const scans = FILES_ROOT.folders.find((f) => f.name === "Scans")!;
  const current = inScans ? scans : FILES_ROOT;
  return (
    <div style={{ height: "100%", overflow: "hidden", padding: "20px 26px 0", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: -0.4, color: C.foreground }}>{current.name}</span>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", opacity: addPressed ? 0.85 : 1, transition: "opacity 120ms ease" }}>
          <Plus size={18} color="#ffffff" />
        </div>
      </div>
      <div>
        {current.folders.map((f) => (
          <Row key={f.id} folder kebab={false} icon={<Folder size={16} color={C.dataAccent} fill={C.dataAccent} />} name={f.name} meta={f.modified} />
        ))}
        {current.files.map((f) => (
          <Row key={f.id} folder={false} kebab icon={<FileText size={16} color={C.tertiaryText} />} name={f.name} meta={[f.type.toUpperCase(), f.size, f.modified].filter(Boolean).join(" · ")} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sheets
 * ------------------------------------------------------------------ */

/** slideup-sheet.tsx: in on 26 / 180, out on 26 / 210 clamped. */
const SPRING_IN = springCurve({ damping: 26, stiffness: 180, mass: 1 });
const SPRING_OUT = springCurve({ damping: 26, stiffness: 210, mass: 1, overshootClamping: true });
const sheetMotion = (open: boolean, delay = 0) =>
  open ? `transform ${SPRING_IN.ms}ms ${SPRING_IN.easing} ${delay}ms` : `transform ${SPRING_OUT.ms}ms ${SPRING_OUT.easing}`;
const scrimMotion = (open: boolean, delay = 0) =>
  open ? `opacity 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms` : "opacity 200ms cubic-bezier(0.455, 0.03, 0.515, 0.955)";

function Sheet({ open, delay = 0, children }: { open: boolean; delay?: number; children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)", opacity: open ? 1 : 0, transition: scrimMotion(open, delay) }} />
      <div
        style={{
          position: "relative",
          background: C.background,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: "8px 8px 0",
          boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: sheetMotion(open, delay),
        }}
      >
        {children}
        <div style={{ height: 34 }} />
      </div>
    </div>
  );
}

function Grabber({ title }: { title?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 16px" }}>
      <div style={{ width: 64, height: 6, borderRadius: 999, background: C.border, marginTop: 4 }} />
      {title ? <span style={{ ...LABEL, alignSelf: "stretch", marginTop: 10, padding: "0 16px" }}>{title}</span> : null}
    </div>
  );
}

/** file-browser.tsx's Add menu on slideup-menu.tsx. */
function AddMenu({ open, pressed }: { open: boolean; pressed?: string }) {
  return (
    <Sheet open={open}>
      <Grabber title="Add" />
      <div style={{ paddingBottom: 4 }}>
        {["New Folder", "New Doc", "Scan", "Upload File"].map((label) => (
          <div key={label} style={{ minHeight: 52, padding: "0 16px", borderRadius: 8, display: "flex", alignItems: "center", background: pressed === label ? C.accent : undefined, transition: "background 120ms ease" }}>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 17, color: C.foreground }}>{label}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/** success-sheet.tsx: SIZE 64, the ring swept from twelve o'clock, the tick, the caption rising. */
const SZ = 64;
const STROKE = Math.round(((SZ * 5) / 72) * 100) / 100;
const R = SZ / 2 - STROKE / 2;
const CIRC = 2 * Math.PI * R;
const TICK_PTS = [[22 / 72, 38 / 72], [33 / 72, 49 / 72], [51 / 72, 26 / 72]] as const;
const TICK = TICK_PTS.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(x * SZ).toFixed(2)} ${(y * SZ).toFixed(2)}`).join(" ");
const TICK_LEN = TICK_PTS.reduce((t, [x, y], i) => (i === 0 ? t : t + Math.hypot((x - TICK_PTS[i - 1][0]) * SZ, (y - TICK_PTS[i - 1][1]) * SZ)), 0);
/** The sheet goes up once the scanner has slid away. */
const AFTER_SCANNER = 350;

function SuccessSheet({ open, title, detail }: { open: boolean; title: string; detail: string }) {
  const d = AFTER_SCANNER;
  return (
    <Sheet open={open} delay={d}>
      <Grabber />
      {open ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "48px 24px 28px" }}>
          <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} fill="none" aria-hidden>
            <circle cx={SZ / 2} cy={SZ / 2} r={R} stroke={MARK} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC} transform={`rotate(-90 ${SZ / 2} ${SZ / 2})`} style={{ animation: `wc-scan-dash 440ms cubic-bezier(0.33, 1, 0.68, 1) ${d + 120}ms both` }} />
            <path d={TICK} stroke={MARK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={TICK_LEN} strokeDashoffset={TICK_LEN} style={{ animation: `wc-scan-dash 320ms cubic-bezier(0.33, 1, 0.68, 1) ${d + 380}ms both` }} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, animation: `wc-scan-rise 260ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${d + 440}ms both` }}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 20, lineHeight: "28px", color: C.foreground }}>{title}</span>
            <span style={{ fontFamily: SANS, fontSize: 16, lineHeight: "24px", color: C.mutedFg, textAlign: "center" }}>{detail}</span>
          </div>
        </div>
      ) : (
        <div style={{ height: 48 + 64 + 14 + 56 + 28 }} />
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ *
 * The scanner
 * ------------------------------------------------------------------ */

const SCRIM = "rgba(0,0,0,0.55)";
const CROP_BAR_H = 12 + 48 + 34 + 12;

function IconBtn({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}

/** running-border.tsx: one lit quadrant turning behind the child, RIM (4) proud of it. */
function RunningBorder({ active, color, children, style }: { active: boolean; color: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", ...style }}>
      {active ? (
        <div style={{ position: "absolute", inset: -4, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 400, height: 400, marginLeft: -200, marginTop: -200, animation: "wc-scan-lap 1600ms linear infinite" }}>
            <div style={{ width: 200, height: 200, background: color }} />
          </div>
        </div>
      ) : null}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

/** crop-step.tsx over the camera: the shot fitted to the stage, the found corners joined by white edges. */
function CropStep({ page, pressed }: { page: 0 | 1; pressed: boolean }) {
  const stageW = 390;
  const stageH = 844 - CROP_BAR_H;
  const s = Math.min(stageW / PHOTO_W, stageH / PHOTO_H);
  const ox = (stageW - PHOTO_W * s) / 2;
  const oy = (stageH - PHOTO_H * s) / 2;
  const pts = corners(page).map((p) => ({ x: ox + p.x * s, y: oy + p.y * s }));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000000", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <Photo w={stageW} h={stageH} fit="contain" page={page} />
        <svg width={stageW} height={stageH} style={{ position: "absolute", inset: 0 }}>
          <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#ffffff" strokeWidth={1} />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={7} fill="#ffffff" />
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", paddingBottom: 34 + 12 }}>
        <div style={{ padding: "12px 16px" }}>
          <span style={{ fontFamily: SANS, fontSize: 15, color: "rgba(255,255,255,0.7)" }}>Retake</span>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <RotateCw size={16} color="#ffffff" />
          <span style={{ fontFamily: SANS, fontSize: 15, color: "#ffffff" }}>Rotate</span>
        </div>
        <div style={{ padding: "12px 16px", opacity: pressed ? 0.6 : 1 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: "#ffffff" }}>Use photo</span>
        </div>
      </div>
    </div>
  );
}

/** The in-app camera, steps 4 to 13. */
function CameraStep({ step }: { step: number }) {
  const pages = step >= 12 ? 2 : step >= 8 ? 1 : 0;
  const inFront: 0 | 1 = step >= 8 ? 1 : 0;
  const cropping = step === 6 || step === 7 ? 0 : step === 10 || step === 11 ? 1 : null;
  const shutterDown = step === 5 || step === 9;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, animation: "wc-scan-hand 3.2s ease-in-out infinite" }}>
        {/* Page 2 turned up in front of the lens after page 1 is taken. */}
        {[0, 1].map((p) => (
          <div key={p} style={{ position: "absolute", inset: 0, opacity: inFront === p ? 1 : 0, transition: "opacity 450ms ease" }}>
            <Photo w={390} h={844} fit="cover" page={p as 0 | 1} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#000000", opacity: shutterDown ? 0.85 : 0, transition: "opacity 120ms ease" }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: `${54 + 8}px 16px 8px`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <IconBtn>
          <X size={22} color="#ffffff" />
        </IconBtn>
        {pages > 0 ? (
          <div style={{ padding: "5px 12px", borderRadius: 999, background: "rgba(0,0,0,0.45)" }}>
            <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 12, letterSpacing: 0.8, color: "#ffffff", textTransform: "uppercase" }}>{pages === 1 ? "1 page" : `${pages} pages`}</span>
          </div>
        ) : null}
        <div style={{ width: 40, height: 40 }} />
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 16px", paddingBottom: 34 + 12 }}>
        {pages === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{ padding: "7px 12px", borderRadius: 999, background: SCRIM }}>
              <span style={{ fontFamily: SANS, fontSize: 13, color: "#ffffff" }}>Line up the document and tap to capture each page</span>
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            {pages > 0 ? (
              <div style={{ position: "relative", width: 56, height: 72, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.35)", background: "#efeadf" }}>
                <Flat page={(pages - 1) as 0 | 1} w={56} h={72} />
                <div style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={13} color="#ffffff" />
                </div>
                {pages > 1 ? (
                  <span style={{ position: "absolute", left: 4, bottom: 2, fontFamily: MONO, fontWeight: 600, fontSize: 11, color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{pages}</span>
                ) : null}
              </div>
            ) : (
              <IconBtn>
                <ImageIcon size={20} color="#ffffff" />
              </IconBtn>
            )}
          </div>
          <div
            style={{
              width: 68,
              height: 68,
              boxSizing: "border-box",
              borderRadius: 999,
              background: "#ffffff",
              border: "4px solid rgba(255,255,255,0.5)",
              backgroundClip: "padding-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: shutterDown ? "scale(0.94)" : "none",
              transition: "transform 100ms ease",
            }}
          >
            <Camera size={26} color="#000000" />
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            {pages > 0 ? (
              <div style={{ height: 44, minWidth: 84, padding: "0 16px", boxSizing: "border-box", borderRadius: 999, background: "#ffffff", opacity: step === 13 ? 0.85 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: "#000000" }}>Save</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {cropping !== null ? <CropStep page={cropping} pressed={step === 7 || step === 11} /> : null}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none" }}>
        <StatusBar time={STATUS_TIME} ink="#ffffff" />
      </div>
    </div>
  );
}

function CardBtn({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}

/** `ReviewScreen`, steps 14 to 18. */
function Review({ step }: { step: number }) {
  const typed = useTicker(step === 15, NAME.length, KEY_MS);
  const name = step < 15 ? "" : step === 15 ? NAME.slice(0, typed) : NAME;
  const keyboard = step === 15;
  const focused = step === 15 || step === 16;
  const filing = step === 18;
  const pressKey = step === 15 && typed > 0 && typed < NAME.length ? NAME[typed].toLowerCase() : undefined;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.background, display: "flex", flexDirection: "column", paddingBottom: keyboard ? KEYBOARD_H : 34, transition: `padding-bottom ${KEYBOARD_MS}ms ${KEYBOARD_EASE}` }}>
      <StatusBar time={STATUS_TIME} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={22} color={C.foreground} />
        </div>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 18, letterSpacing: -0.2, color: C.foreground }}>2 pages</span>
        <div style={{ width: 40, height: 40 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* FormTextField "Document name" */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: "0 4px" }}>
            <span style={{ fontFamily: SANS, fontSize: 13, color: C.mutedFg }}>Document name</span>
          </div>
          <div style={{ minHeight: 52, display: "flex", alignItems: "center", padding: "0 16px", background: C.muted, borderRadius: 6 }}>
            <span style={{ fontWeight: 500, fontSize: 16, lineHeight: "52px", color: name ? C.foreground : C.mutedFg, whiteSpace: "nowrap", overflow: "hidden" }}>
              {name || (focused ? "" : NAME_HINT)}
              {focused && step === 15 ? <BlinkCaret /> : null}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[0, 1].map((p) => (
            <div key={p} style={{ width: 132, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgSubtle, overflow: "hidden" }}>
              <div style={{ position: "relative", width: "100%", height: 168, overflow: "hidden", background: C.muted }}>
                <Flat page={p as 0 | 1} w={132} h={168} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 12, color: C.tertiaryText }}>{p + 1}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CardBtn>
                    <RotateCw size={15} color={C.foreground} />
                  </CardBtn>
                  <CardBtn>
                    <ChevronLeft size={16} color={p === 0 ? C.mutedFg : C.foreground} />
                  </CardBtn>
                  <CardBtn>
                    <ChevronRight size={16} color={p === 1 ? C.mutedFg : C.foreground} />
                  </CardBtn>
                  <CardBtn>
                    <Trash2 size={15} color={C.destructive} />
                  </CardBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px", borderTop: `1px solid ${C.border}`, background: C.background }}>
        <div style={{ flex: 1, height: 52, borderRadius: 999, border: `1px solid ${C.border}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: filing ? 0.5 : 1 }}>
          <Plus size={16} color={C.foreground} />
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.foreground }}>Add pages</span>
        </div>
        <RunningBorder active={filing} color={C.info} style={{ flex: 1 }}>
          <div style={{ height: 52, borderRadius: 999, background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: name ? (step === 17 ? 0.85 : 1) : 0.5 }}>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: "#ffffff" }}>Save</span>
            <ArrowRight size={16} color="#ffffff" />
          </div>
        </RunningBorder>
      </div>
      <IosKeyboard up={keyboard} pressKey={pressKey} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The screen
 * ------------------------------------------------------------------ */

export function DocumentsPhoneScanScreen() {
  const step = useStepLoop(STEPS);
  const scannerUp = step >= 4 && step <= 18;
  const reviewing = step >= 14;
  const inScans = step >= 19;
  return (
    <PhoneFrame time={STATUS_TIME}>
      <style>{`@keyframes wc-scan-dash { to { stroke-dashoffset: 0; } } @keyframes wc-scan-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } } @keyframes wc-scan-lap { to { transform: rotate(360deg); } } @keyframes wc-scan-hand { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-3px, 2px) rotate(-0.4deg); } }`}</style>
      {/* The header gives back metrics.headerStatusTrim (8) of the status-bar inset. */}
      <div style={{ position: "relative", marginTop: -8, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <AppHeader />
        <div style={{ flex: 1, minHeight: 0 }}>
          <FilesPage inScans={inScans} addPressed={step === 1} />
        </div>
      </div>

      <AddMenu open={step === 2 || step === 3} pressed={step === 3 ? "Scan" : undefined} />
      <SuccessSheet open={step === 19} title="Scan filed" detail={`${FILE_NAME} · Scans`} />

      {/* DocumentScanner: a full-screen Modal sliding up over the browser, and away once filed. */}
      <div
        style={{
          position: "absolute",
          top: -54,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          transform: scannerUp ? "translateY(0)" : "translateY(100%)",
          transition: `transform 350ms cubic-bezier(0.25, 0.1, 0.25, 1) ${scannerUp ? 200 : 0}ms`,
        }}
      >
        {reviewing ? <Review step={step} /> : <CameraStep step={step} />}
      </div>
    </PhoneFrame>
  );
}
