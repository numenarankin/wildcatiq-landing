"use client";

/**
 * Add Run Ticket on the phone, scanning a paper ticket off Smith T202 and
 * played on a loop: the blank form, Scan ticket, the in-app camera, the
 * shutter, the corner crop, Use photo, Save while Orion reads it, then the
 * filled form scrolled from the scanner pill down to the gravity it left
 * blank. Transcribed from mobile-background:
 * - src/components/tanks/tank-run-ticket-entry.tsx on
 *   src/components/ui/fullscreen-form.tsx (content padding 16 with 8 on top,
 *   fields 18 apart, the 52pt pinned pill CTA; the "Scan ticket" pill; a new
 *   ticket is `emptyTicketDraft(today)`: the date and nothing else)
 * - src/components/scan/document-scanner.tsx in the `quick` flow the ticket
 *   form mounts (a full-screen Modal sliding up; the close button and page
 *   count on top; the hint pill "Line up the document and tap to capture each
 *   page"; the photo button, the 68pt white shutter, then the last page's
 *   56 x 72 thumbnail and the Save pill, which turns grey, reads "Saving" and
 *   carries running-border.tsx's lit quadrant, 1.6 s a lap in MARK_COLOR, for
 *   as long as the model reads; the scanner stays open until the fields are back)
 * - src/components/scan/crop-step.tsx (the shot fitted to the stage, 1pt white
 *   edges between 14pt corner dots placed on the detected page, then Retake,
 *   Rotate and Use photo)
 * - src/lib/tickets/draft.ts `draftFromExtracted`: every printed field filled
 *   and tagged " · scanned", every unprinted one left blank, so the API
 *   gravity the ticket did not print reads as "check this", never 0 °API.
 *
 * The camera's picture is drawn here: it is the world in front of the lens,
 * like the status bar is the OS, not the app. The ticket on it prints exactly
 * what the extraction returns, from mobileFixture().ticket.
 */
import { Camera, Image as ImageIcon, RotateCw, ScanLine, X } from "lucide-react";
import { formatFeetInches, mobileFixture } from "@/lib/screens/mobile-fixture";
import { mobileAFixture } from "@/lib/screens/mobile-a-fixture";
import { C, MONO, PhoneFrame, SANS, StatusBar } from "./phone";
import { FormCta, FormRow, SheetTopBar } from "./form-shell";
import { useStepLoop } from "./motion";

/** format.ts `formatDate`. */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

/** format.ts `formatTime`. */
function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** numeric-entry.ts `optionalRaw`: a number as the string a field holds. */
const optionalRaw = (v: number | null): string => (v == null ? "" : String(Number(v.toFixed(4))));

/** fullscreen-data-entry.tsx `formatThousands`. */
function formatThousands(raw: string): string {
  const [int, dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec != null ? `${grouped}.${dec}` : grouped;
}

const T = mobileFixture().ticket;
const PRINTED = mobileAFixture().ticketPrinted;
const round2 = (n: number) => Math.round(n * 100) / 100;
const MARK = "#1a71ff";

// The loop's beats.
const STEPS = [
  1400, // 0 the blank form
  350, // 1 Scan ticket pressed
  1000, // 2 the camera slides up, lined up on the ticket
  260, // 3 shutter
  1100, // 4 the crop: corners on the page
  200, // 5 Use photo pressed
  700, // 6 back on the camera with the page taken
  200, // 7 Save pressed
  1800, // 8 Saving: Orion reads the ticket
  900, // 9 the scanner slides away, the form filled
  9000, // 10 the filled form, scrolled down to the gravity and back
] as const;

/* ------------------------------------------------------------------ *
 * The picture in front of the lens: a printed run ticket on a truck hood
 * ------------------------------------------------------------------ */

/** The photo's frame (3:4, as the camera shoots a portrait still) and the ticket's place on it. */
const PHOTO_W = 300;
const PHOTO_H = 400;
const PAPER = { w: 158, h: 236, cx: 152, cy: 196, rot: -5 };

/** The ticket's four corners in photo coordinates: where edge detection puts the crop dots. */
const CORNERS = (() => {
  const a = (PAPER.rot * Math.PI) / 180;
  const pts = [
    [-PAPER.w / 2, -PAPER.h / 2],
    [PAPER.w / 2, -PAPER.h / 2],
    [PAPER.w / 2, PAPER.h / 2],
    [-PAPER.w / 2, PAPER.h / 2],
  ];
  return pts.map(([x, y]) => ({ x: PAPER.cx + x * Math.cos(a) - y * Math.sin(a), y: PAPER.cy + x * Math.sin(a) + y * Math.cos(a) }));
})();

const MDY = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

/** The paper ticket, flat, in its own 158 x 236 box: what the driver's printer put on it. */
function TicketPaper() {
  const row = (label: string, value: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "0.6px solid #b9b3a6", padding: "3.2px 0 2px" }}>
      <span style={{ fontSize: 5.4, letterSpacing: 0.2, color: "#4a463f", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 7, fontWeight: 600, color: "#1d1b18", minWidth: 40, textAlign: "right" }}>{value || " "}</span>
    </div>
  );
  return (
    <div style={{ width: PAPER.w, height: PAPER.h, background: "linear-gradient(170deg, #f7f4ec 0%, #efeadf 60%, #e6e0d2 100%)", padding: "10px 10px 8px", boxSizing: "border-box", fontFamily: MONO, color: "#1d1b18", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 0.4, textAlign: "center" }}>{T.purchaser.toUpperCase()}</div>
      <div style={{ fontSize: 5.6, letterSpacing: 0.6, textAlign: "center", color: "#4a463f", marginTop: 1 }}>CRUDE OIL RUN TICKET</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 6.4 }}>
        <span>NO. {T.number}</span>
        <span>{MDY(T.date)}</span>
      </div>
      <div style={{ marginTop: 5, borderTop: "1px solid #1d1b18" }}>
        {row("Lease / tank", T.tank.name)}
        {row("Departure", PRINTED.departureTime)}
        {row("Opening gauge", formatFeetInches(T.openIn))}
        {row("Closing gauge", formatFeetInches(T.closeIn))}
        {row("Gross bbls", round2(T.bbl).toFixed(2))}
        {row("BS&W %", String(PRINTED.bsW))}
        {row("Obs gravity", "")}
        {row("Net bbls", "")}
        {row("Transporter", "")}
      </div>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 5, color: "#6b665d" }}>
        <span>DRIVER ____________</span>
        <span>WITNESS __________</span>
      </div>
    </div>
  );
}

/** The scene at photo size: the hood, the ticket on it, the light falling across. */
function TicketScene() {
  return (
    <div style={{ position: "relative", width: PHOTO_W, height: PHOTO_H, overflow: "hidden", background: "radial-gradient(120% 90% at 40% 30%, #6d7176 0%, #4b4f54 45%, #2e3134 100%)" }}>
      {/* the hood's panel line and a reflection */}
      <div style={{ position: "absolute", left: -20, right: -20, top: 330, height: 2, background: "rgba(0,0,0,0.35)", transform: "rotate(-3deg)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 300, height: 140, background: "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 60%)" }} />
      <div
        style={{
          position: "absolute",
          left: PAPER.cx - PAPER.w / 2,
          top: PAPER.cy - PAPER.h / 2,
          transform: `rotate(${PAPER.rot}deg)`,
          boxShadow: "6px 10px 18px rgba(0,0,0,0.45)",
        }}
      >
        <TicketPaper />
      </div>
      {/* daylight, uneven, as a phone sees it */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,250,235,0.10) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.18) 100%)" }} />
    </div>
  );
}

/** The scene scaled into a box: `cover` for the viewfinder, `contain` for the shot. */
function Photo({ w, h, fit }: { w: number; h: number; fit: "cover" | "contain" }) {
  const s = fit === "cover" ? Math.max(w / PHOTO_W, h / PHOTO_H) : Math.min(w / PHOTO_W, h / PHOTO_H);
  return (
    <div style={{ position: "absolute", left: (w - PHOTO_W * s) / 2, top: (h - PHOTO_H * s) / 2, width: PHOTO_W, height: PHOTO_H, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <TicketScene />
    </div>
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

/** running-border.tsx: one lit quadrant turning behind the pill, 4pt proud of it. */
function RunningBorder({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {active ? (
        <div style={{ position: "absolute", inset: -4, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 200, height: 200, marginLeft: -100, marginTop: -100, animation: "wc-lap 1600ms linear infinite" }}>
            <div style={{ width: 100, height: 100, background: MARK }} />
          </div>
        </div>
      ) : null}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

function Scanner({ step }: { step: number }) {
  const taken = step >= 6;
  const cropping = step === 4 || step === 5;
  const saving = step === 8;
  const shutterDown = step === 3;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000000", overflow: "hidden" }}>
      {/* The viewfinder: the live picture, held in a hand */}
      <div style={{ position: "absolute", inset: 0, animation: "wc-hand 3.2s ease-in-out infinite" }}>
        <Photo w={390} h={844} fit="cover" />
      </div>
      {/* expo-camera's shutter animation */}
      <div style={{ position: "absolute", inset: 0, background: "#000000", opacity: shutterDown ? 0.85 : 0, transition: "opacity 120ms ease" }} />

      {/* Top bar: close, and the page count once there is a page */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: `${54 + 8}px 16px 8px`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <IconBtn>
          <X size={22} color="#ffffff" />
        </IconBtn>
        {taken ? (
          <div style={{ padding: "5px 12px", borderRadius: 999, background: "rgba(0,0,0,0.45)" }}>
            <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 12, letterSpacing: 0.8, color: "#ffffff", textTransform: "uppercase" }}>1 page</span>
          </div>
        ) : null}
        <div style={{ width: 40, height: 40 }} />
      </div>

      {/* Bottom controls, over the picture */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 16px", paddingBottom: 34 + 12 }}>
        {!taken ? (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{ padding: "7px 12px", borderRadius: 999, background: SCRIM }}>
              <span style={{ fontFamily: SANS, fontSize: 13, color: "#ffffff" }}>Line up the document and tap to capture each page</span>
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            {taken ? (
              <div style={{ position: "relative", width: 56, height: 72, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.35)", background: "#efeadf" }}>
                <div style={{ transform: `scale(${56 / PAPER.w}, ${72 / PAPER.h})`, transformOrigin: "top left" }}>
                  <TicketPaper />
                </div>
                <div style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={13} color="#ffffff" />
                </div>
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
            {taken ? (
              <RunningBorder active={saving}>
                <div
                  style={{
                    height: 44,
                    minWidth: 84,
                    padding: "0 16px",
                    boxSizing: "border-box",
                    borderRadius: 999,
                    background: saving ? C.border : "#ffffff",
                    opacity: step === 7 ? 0.85 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: saving ? C.mutedFg : "#000000" }}>{saving ? "Saving" : "Save"}</span>
                </div>
              </RunningBorder>
            ) : null}
          </div>
        </div>
      </div>

      {/* The crop step, over the camera */}
      {cropping ? <CropStep pressed={step === 5} /> : null}
      {/* The OS status bar, white over the camera and the crop alike */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none" }}>
        <StatusBar time="8:31" ink="#ffffff" />
      </div>
    </div>
  );
}

/** crop-step.tsx: the shot fitted to the stage, the page's corners as dots joined by white edges. */
function CropStep({ pressed }: { pressed: boolean }) {
  const stageW = 390;
  const stageH = 844 - CROP_BAR_H;
  const s = Math.min(stageW / PHOTO_W, stageH / PHOTO_H);
  const ox = (stageW - PHOTO_W * s) / 2;
  const oy = (stageH - PHOTO_H * s) / 2;
  const pts = CORNERS.map((p) => ({ x: ox + p.x * s, y: oy + p.y * s }));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000000", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <Photo w={stageW} h={stageH} fit="contain" />
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

/* ------------------------------------------------------------------ *
 * The form
 * ------------------------------------------------------------------ */

/** Pan distance: from the top of the column to where the API gravity row clears the CTA. */
const PAN = 470;

export function RunTicketScreen() {
  const step = useStepLoop(STEPS);
  const filled = step >= 9;
  const scannerUp = step >= 2 && step <= 8;

  // emptyTicketDraft(today), then draftFromExtracted: the ticket as the extractor returned it.
  const draft = filled
    ? {
        date: T.date,
        departureTime: PRINTED.departureTime,
        ticketNo: T.number,
        purchaser: T.purchaser,
        transporter: "",
        grossBbls: optionalRaw(round2(T.bbl)),
        netBbls: "",
        apiGravity: "",
        bsW: optionalRaw(PRINTED.bsW),
        openingGauge: optionalRaw(T.openIn),
        closingGauge: optionalRaw(T.closeIn),
      }
    : { date: T.date, departureTime: "", ticketNo: "", purchaser: "", transporter: "", grossBbls: "", netBbls: "", apiGravity: "", bsW: "", openingGauge: "", closingGauge: "" };
  const scanned = new Set(filled ? ["date", "departureTime", "ticketNo", "purchaser", "grossBbls", "bsW", "openingGauge", "closingGauge"] : []);
  const label = (key: string, text: string) => (scanned.has(key) ? `${text} · scanned` : text);

  return (
    <PhoneFrame time="8:31">
      <style>{`@keyframes wc-ticket-pan { 0%, 22% { transform: translateY(0); } 38%, 74% { transform: translateY(-${PAN}px); } 92%, 100% { transform: translateY(0); } } @keyframes wc-lap { to { transform: rotate(360deg); } } @keyframes wc-hand { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-3px, 2px) rotate(-0.4deg); } }`}</style>
      <SheetTopBar title="Add Run Ticket" />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div style={{ padding: "8px 16px 32px", display: "flex", justifyContent: "center", animation: step === 10 ? "wc-ticket-pan 9s cubic-bezier(0.45, 0, 0.25, 1) both" : "none" }}>
          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* header: the scan pill */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, border: `1px solid ${C.border}`, background: step === 1 ? C.muted : "transparent", transition: "background 120ms ease" }}>
                <ScanLine size={18} color={C.foreground} />
                <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, lineHeight: "22px", color: C.foreground }}>Scan ticket</span>
              </div>
            </div>

            <FormRow label={label("date", "Date")} value={formatDate(draft.date)} />
            <FormRow label={label("departureTime", "Departure time")} value={draft.departureTime ? formatTime(draft.departureTime) : ""} placeholder="Not read" />
            <FormRow label={label("ticketNo", "Ticket #")} value={draft.ticketNo} placeholder="e.g. 10432" caret={false} />
            <FormRow label={label("purchaser", "Purchaser")} value={draft.purchaser} placeholder="Buyer" />
            <FormRow label={label("transporter", "Transport company")} value={draft.transporter} placeholder="Trucking company" />
            <FormRow label={label("openingGauge", "Open gauge")} value={draft.openingGauge === "" ? "" : formatFeetInches(Number(draft.openingGauge))} placeholder="Not read" />
            <FormRow label={label("closingGauge", "Close gauge")} value={draft.closingGauge === "" ? "" : formatFeetInches(Number(draft.closingGauge))} placeholder="Not read" />
            <FormRow label={label("grossBbls", "Gross barrels")} value={formatThousands(draft.grossBbls)} placeholder="0" caret={false} />
            <FormRow label={label("netBbls", "Net barrels (as printed)")} value={draft.netBbls} placeholder="0" caret={false} />
            <FormRow label={label("apiGravity", "API gravity (°)")} value={draft.apiGravity} placeholder="0" caret={false} />
            <FormRow label={label("bsW", "BS&W")} value={draft.bsW} placeholder="0" caret={false} />
          </div>
        </div>
      </div>
      <FormCta label="Save Ticket" />
      {/* insets.bottom under the pinned CTA */}
      <div style={{ height: 34 }} />

      {/* The scanner: a full-screen Modal, sliding up over the form and away again */}
      <div
        style={{
          position: "absolute",
          top: -54,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          transform: scannerUp ? "translateY(0)" : "translateY(100%)",
          transition: "transform 350ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      >
        <Scanner step={step} />
      </div>
    </PhoneFrame>
  );
}
