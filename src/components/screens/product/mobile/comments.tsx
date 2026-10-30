"use client";

/**
 * A well's comment thread on the phone, played on a loop: the thread open over
 * the Smith 4 page, the owner likes the pumper's note, taps the composer
 * (the sheet grows to 0.88 and the keyboard rises), types, sends, the comment
 * lands at the top as "now", the sheet springs away and opens again. Transcribed from
 * mobile-background:
 * - src/components/comments/comments-sheet.tsx (three fifths of the screen at
 *   rest and 0.88 once typing, "<facility> Comments" heading 17 semibold, rows
 *   of 32px photo, name, age, like column; replies indented 44 with 24px
 *   photos; Reply under each; a like fills the thumb dataAccent; the dock 12
 *   from the sides, 12 above a raised keyboard)
 * - src/components/ui/slideup-sheet.tsx (18 radius, 8 padding, 64 x 6 grabber;
 *   in on a spring of damping 26 / stiffness 180, out on 26 / 210 clamped; the
 *   scrim in over 220 ms, out over 200; bottom padding max(insets + 16, keyboard))
 * - src/components/ai/chat-composer.tsx (the floating pill: 16px draft, 32px
 *   send button disabled on an empty draft; no attach button on comments)
 * - src/components/ui/avatar.tsx (initials on muted) and lib/format.ts `relativeAge`
 * - behind it, src/components/wells/well-workspace.tsx: the Smith 4 page
 *   (WorkspaceHeader title, settings gear, the 44px Add circle, and the
 *   production chart's rate line: 14-day EMA oil at 2 dp, gas at 0 dp)
 *
 * The thread is Smith 4's in mobile-b-fixture.ts; the rate line is the
 * EMA over the dashboard fixture's daily series for Smith 4.
 */
import { ArrowUp, Maximize2, Plus, Settings, Settings2, ThumbsUp } from "lucide-react";
import { IosKeyboard, KEYBOARD_EASE, KEYBOARD_H, KEYBOARD_MS, springCurve, useStepLoop, useTicker } from "./motion";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
import { SCREEN_NOW, SMITH4_COMMENTS, type ThreadComment } from "@/lib/screens/mobile-b-fixture";
import { OPERATOR } from "@/lib/screens/operator";
import { AppHeader, C, CONTENT_TOP, LABEL, MONO, PhoneFrame } from "./phone";
import { OilChart } from "./dashboard";

const OPERATOR_OWNER = OPERATOR.owner;

/** lib/format.ts `relativeAge`, verbatim. */
function relativeAge(epochMs: number, now: number): string {
  const min = Math.floor((now - epochMs) / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const week = Math.floor(day / 7);
  if (day < 365) return `${week}w`;
  return `${Math.floor(day / 365)}y`;
}

/** avatar.tsx `initialsFrom`: first and last initials. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

function Avatar({ name, size }: { name: string; size: 24 | 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: C.muted, border: "0.5px solid rgba(10,10,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontWeight: 500, fontSize: size === 24 ? 12 : 14, color: C.mutedFg }}>{initials(name)}</span>
    </div>
  );
}

function CommentRow({ c, compact }: { c: ThreadComment; compact?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <Avatar name={c.author} size={compact ? 24 : 32} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14, lineHeight: "22px", whiteSpace: "nowrap" }}>{c.author}</span>
          <span style={{ fontSize: 11, lineHeight: "16px", color: C.tertiaryText }}>{relativeAge(c.createdAt, SCREEN_NOW)}</span>
        </div>
        <span style={{ fontSize: 14, lineHeight: "22px" }}>{c.body}</span>
        <span style={{ fontWeight: 500, fontSize: 13, lineHeight: "20px", color: C.mutedFg, paddingTop: 4 }}>Reply</span>
      </div>
      <div style={{ alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingLeft: 4, minWidth: 32 }}>
        <ThumbsUp size={15} color={c.likedByMe ? C.dataAccent : C.mutedFg} fill={c.likedByMe ? C.dataAccent : "transparent"} />
        {c.likeCount > 0 ? <span style={{ fontSize: 11, lineHeight: "16px", color: C.tertiaryText, fontVariantNumeric: "tabular-nums" }}>{c.likeCount}</span> : null}
      </div>
    </div>
  );
}

const vol = (dp: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** lib/analytics.ts `ema`: seeded on the first `days` mean, the last smoothed value. */
function lastEma(values: number[], days: number): number {
  let prev = values.slice(0, days).reduce((a, v) => a + v, 0) / days;
  const k = 2 / (days + 1);
  for (let i = days; i < values.length; i++) prev = values[i] * k + prev * (1 - k);
  return prev;
}

/**
 * The Smith 4 page under the app header (well-workspace.tsx): title and
 * settings gear, the 44pt Add circle, the 14-day EMA rate, production-chart.tsx's
 * view pills and buttons, and the well's oil for the last 30 days.
 */
export function Smith4Body({ scrollY = 0 }: { scrollY?: number }) {
  const fx = dashboardFixture();
  const well = fx.wellRows.find((r) => r.wellId === "w-s4")!;
  // production-chart.tsx `headline="ema14"`: the rate is the 14-day EMA over the full daily series.
  const daily = fx.dailyByWell.find((d) => d.wellId === "w-s4")!.daily;
  const oil = lastEma(daily.map((d) => d.oilBbl), 14);
  const gas = lastEma(daily.map((d) => d.gasMcf), 14);
  // production-table.tsx: newest first; a whole number at 0 dp, else 1; widths from column-width.ts.
  const rows = [...daily].reverse().slice(0, 14);
  const num = (v: number) => vol(Number.isInteger(v) ? 0 : 1).format(v);
  const mmddyy = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(2, 4)}`;
  const cols = [
    { header: "Date", w: colWidth("Date", rows.map((d) => mmddyy(d.date))) },
    { header: "Oil (bbl/d)", w: colWidth("Oil (bbl/d)", rows.map((d) => num(d.oilBbl))) },
    { header: "Gas (MCF/d)", w: colWidth("Gas (MCF/d)", rows.map((d) => num(d.gasMcf))) },
    { header: "Saltwater (bbl/d)", w: colWidth("Saltwater (bbl/d)", rows.map((d) => num(d.water))) },
  ];
  const grid = cols.map((c) => `${c.w}px`).join(" ");
  const tabs = ["Production", "Info", "Service", "Comments", "Notes", "Tests"];
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
    <div style={{ padding: "20px 26px 0", display: "flex", flexDirection: "column", gap: 4, transform: `translateY(${-scrollY}px)`, transition: "transform 700ms cubic-bezier(0.25, 0.1, 0.25, 1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 24, letterSpacing: -0.4 }}>{well.name}</span>
          <Settings size={18} color={C.foreground} />
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", transform: "translateY(13px)" }}>
          <Plus size={20} color={C.primaryFg} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 22, lineHeight: "26px" }}>{vol(2).format(oil)}</span>
        <span style={{ fontSize: 12, color: C.mutedFg }}>bbl/d</span>
        <span style={{ fontSize: 12, color: C.mutedFg }}>·</span>
        <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 22, lineHeight: "26px" }}>{vol(0).format(gas)}</span>
        <span style={{ fontSize: 12, color: C.mutedFg }}>mcf/d</span>
      </div>
      {/* production-chart.tsx's view pills and its settings / expand buttons, the chart itself under the sheet */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 18 }}>
        <div style={{ flex: 1, display: "flex", background: C.muted, borderRadius: 999, padding: 2, gap: 2 }}>
          {["Oil", "Net Rev"].map((o, i) => (
            <div key={o} style={{ flex: 1, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: i === 0 ? C.background : "transparent", boxShadow: i === 0 ? "0 1px 2px rgba(0,0,0,0.06)" : undefined }}>
              <span style={{ fontWeight: 500, fontSize: 12, color: i === 0 ? C.foreground : C.mutedFg }}>{o}</span>
            </div>
          ))}
        </div>
        {[Settings2, Maximize2].map((Icon, i) => (
          <div key={i} style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={15} color={C.foreground} />
          </div>
        ))}
      </div>
      {/* the well's oil, the last 30 days, on the dashboard's line chart */}
      <div style={{ paddingTop: 16 }}>
        <OilChart points={daily.slice(-30).map((d) => ({ date: d.date, y: d.oilBbl }))} />
      </div>
      {/* facility-workspace.tsx: UnderlineTabs (16 above, 12 below, the grey pill behind Production), then the pane */}
      <div style={{ display: "flex", gap: 4, margin: "16px -26px 12px 0", overflow: "hidden" }}>
        {tabs.map((t, i) => (
          <div key={t} style={{ padding: "9px 16px", borderRadius: 999, background: i === 0 ? C.muted : "transparent", flexShrink: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 16, color: i === 0 ? C.foreground : C.mutedFg }}>{t}</span>
          </div>
        ))}
      </div>
      {/* production-table.tsx on DataTable under PlainTableHeaders: wider than the screen, so it scrolls sideways */}
      <div style={{ overflow: "hidden", marginRight: -26 }}>
        <div style={{ width: cols.reduce((a, c) => a + c.w, 0) }}>
          <div style={{ height: 48, display: "grid", gridTemplateColumns: grid, alignItems: "center", borderBottom: `0.5px solid ${C.border}80` }}>
            {cols.map((c, i) => (
              <span key={c.header} style={{ ...LABEL, padding: "0 8px", textAlign: i > 0 ? "right" : "left", whiteSpace: "nowrap" }}>{c.header}</span>
            ))}
          </div>
          {rows.map((d) => (
            <div key={d.date} style={{ display: "grid", gridTemplateColumns: grid, alignItems: "center", padding: "14px 0", borderBottom: `0.5px solid ${C.border}80` }}>
              <span style={{ padding: "0 8px", fontWeight: 500, fontSize: 15 }}>{mmddyy(d.date)}</span>
              {[d.oilBbl, d.gasMcf, d.water].map((v, i) => (
                <span key={i} style={{ padding: "0 8px", fontSize: 15, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{num(v)}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

/** lib/table/column-width.ts `columnWidth`, verbatim. */
function colWidth(header: string, cells: string[]): number {
  const textWidth = (t: string) => [...t].reduce((w, ch) => w + (/[0-9A-Za-z]/.test(ch) ? 8.4 : 4.6), 0);
  let widest = header.length * 7.8;
  for (const t of cells) widest = Math.max(widest, textWidth(t));
  return Math.round(widest + 36);
}

const OPEN = springCurve({ damping: 26, stiffness: 180, mass: 1 });
const CLOSE = springCurve({ damping: 26, stiffness: 210, mass: 1, overshootClamping: true });
const DRAFT = "Pulling unit is set for Friday. Leave the timer where it is till then.";
const TYPE_MS = 42;
const STEPS = [
  OPEN.ms + 1300, // 0 the thread, open over the Smith 4 page
  1500, // 1 the like
  700, // 2 composer tapped: the sheet grows, the keyboard rises
  DRAFT.length * TYPE_MS + 500, // 3 typing
  3800, // 4 sent: the comment lands, the keyboard drops
  CLOSE.ms + 300, // 5 the sheet springs away
  500, // 6 the page, then the thread opens again
] as const;
/** slideup-sheet.tsx `baseBottom`: max(insets.bottom 34, 24) + 16. */
const BASE_BOTTOM = 50;

export function CommentsScreen() {
  const step = useStepLoop(STEPS);
  const typed = useTicker(step === 3, DRAFT.length, TYPE_MS);
  const well = dashboardFixture().wellRows.find((r) => r.wellId === "w-s4")!;

  const open = step <= 4;
  const typing = step >= 2 && step <= 5;
  const keyboard = step === 2 || step === 3;
  const sheetH = Math.round(844 * (typing ? 0.88 : 0.6));
  const draft = step === 3 ? DRAFT.slice(0, typed) : "";
  // The pumper's note before and after the owner's like; the fixture holds it liked.
  const liked = step >= 1 && step <= 5;
  const posted: ThreadComment = { id: "c-new", author: OPERATOR_OWNER, createdAt: SCREEN_NOW, body: DRAFT, likeCount: 0, likedByMe: false, replies: [] };
  const thread = [
    ...(step === 4 || step === 5 ? [posted] : []),
    ...SMITH4_COMMENTS.map((c) => (c.id === "c2" && !liked ? { ...c, likedByMe: false, likeCount: 0 } : c)),
  ];

  return (
    <PhoneFrame time="7:41">
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10 }}>
        <AppHeader back />
      </div>

      {/* The Smith 4 page behind the sheet, under the header */}
      <div style={{ paddingTop: CONTENT_TOP - 54 }}>
        <Smith4Body />
      </div>

      {/* SlideUpSheet over the scrim */}
      <div style={{ position: "absolute", top: -54, left: 0, right: 0, bottom: 0, zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end", pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)", opacity: open ? 1 : 0, transition: open ? "opacity 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "opacity 200ms cubic-bezier(0.455, 0.03, 0.515, 0.955)" }} />
        <div
          style={{
            position: "relative",
            height: sheetH,
            boxSizing: "border-box",
            background: C.card,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: `8px 8px ${keyboard ? KEYBOARD_H : BASE_BOTTOM}px`,
            boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            transform: open ? "translateY(0)" : "translateY(105%)",
            transition: `transform ${open ? OPEN.ms : CLOSE.ms}ms ${open ? OPEN.easing : CLOSE.easing}, padding-bottom ${KEYBOARD_MS}ms ${KEYBOARD_EASE}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 16px" }}>
            <div style={{ width: 64, height: 6, borderRadius: 999, background: C.border, marginTop: 4 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 17, lineHeight: "22px", textAlign: "center", paddingTop: 10, paddingBottom: 20 }}>{`${well.name} Comments`}</span>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "4px 16px 12px", display: "flex", flexDirection: "column", gap: 18 }}>
            {thread.map((c) => (
              <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <CommentRow c={c} />
                {c.replies.length > 0 ? (
                  <div style={{ paddingLeft: 44, display: "flex", flexDirection: "column", gap: 14 }}>
                    {c.replies.map((r) => (
                      <CommentRow key={r.id} c={r} compact />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {/* dock: the composer pill, no attach button */}
          <div style={{ padding: `8px 12px ${keyboard ? 12 : 0}px`, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, borderRadius: 24, background: C.background, boxShadow: "0 0 20px rgba(0,0,0,0.16)", padding: "4px 10px 4px 4px" }}>
              <span style={{ flex: 1, minWidth: 0, alignSelf: "center", margin: "6px 0", padding: "0 8px", fontSize: 16, lineHeight: "22px", color: draft ? C.foreground : C.tertiaryText }}>
                {draft || "Add a comment…"}
                {keyboard ? <span style={{ display: "inline-block", width: 2, height: 20, marginLeft: draft ? 1 : -1, verticalAlign: "-4px", background: C.foreground, animation: "wc-cursor 1s steps(1, end) infinite" }} /> : null}
              </span>
              <div style={{ width: 32, height: 32, marginBottom: 4, borderRadius: 999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", opacity: draft ? 1 : 0.5, flexShrink: 0 }}>
                <ArrowUp size={18} color={C.primaryFg} />
              </div>
            </div>
          </div>
        </div>
        <style>{"@keyframes wc-cursor { 0% { opacity: 1; } 50% { opacity: 0; } }"}</style>
      </div>
      <IosKeyboard up={keyboard} pressKey={step === 3 && typed > 0 ? DRAFT[typed - 1]?.toLowerCase() : undefined} />
    </PhoneFrame>
  );
}
