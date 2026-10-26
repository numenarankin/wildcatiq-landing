"use client";

/**
 * A well's comment thread on the phone, transcribed from wildcat-phone:
 * - src/components/comments/comments-sheet.tsx (three fifths of the screen at
 *   rest, "<facility> Comments" heading 17 semibold, rows of 32px photo, name,
 *   age, like column; replies indented 44 with 24px photos; Reply under each)
 * - src/components/ui/slideup-sheet.tsx (18 radius, 8 padding, 64 x 6 grabber)
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
import { ArrowUp, Plus, Settings, ThumbsUp } from "lucide-react";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
import { SCREEN_NOW, SMITH4_COMMENTS, type ThreadComment } from "@/lib/screens/mobile-b-fixture";
import { AppHeader, C, CONTENT_TOP, MONO, PhoneFrame } from "./phone";

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
          <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>{c.author}</span>
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

export function CommentsScreen() {
  const fx = dashboardFixture();
  const well = fx.wellRows.find((r) => r.wellId === "w-s4")!;
  // production-chart.tsx `headline="ema14"`: the rate is the 14-day EMA over the full daily series.
  const daily = fx.dailyByWell.find((d) => d.wellId === "w-s4")!.daily;
  const oil = lastEma(daily.map((d) => d.oilBbl), 14);
  const gas = lastEma(daily.map((d) => d.gasMcf), 14);
  const sheetH = Math.round(844 * 0.6);

  return (
    <PhoneFrame time="7:41">
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10 }}>
        <AppHeader back />
      </div>

      {/* The Smith 4 page, as far as the sheet leaves it visible */}
      <div style={{ padding: `${CONTENT_TOP - 54 + 20}px 26px 0`, display: "flex", flexDirection: "column", gap: 4 }}>
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
      </div>

      {/* SlideUpSheet at fraction 0.6 over the scrim */}
      <div style={{ position: "absolute", top: -54, left: 0, right: 0, bottom: 0, zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)" }} />
        <div style={{ position: "relative", height: sheetH, background: C.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: "8px 8px 0", boxShadow: "0 16px 40px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 16px" }}>
            <div style={{ width: 64, height: 6, borderRadius: 999, background: C.border, marginTop: 4 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 17, textAlign: "center", paddingTop: 10, paddingBottom: 20 }}>{`${well.name} Comments`}</span>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "4px 16px 12px", display: "flex", flexDirection: "column", gap: 18 }}>
            {SMITH4_COMMENTS.map((c) => (
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
          {/* dock: the composer pill, over the home indicator inset */}
          <div style={{ padding: "8px 12px 34px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, borderRadius: 24, background: C.background, boxShadow: "0 0 20px rgba(0,0,0,0.16)", padding: "4px 10px 4px 4px" }}>
              <span style={{ flex: 1, alignSelf: "center", margin: "6px 0", padding: "0 8px", fontSize: 16, lineHeight: "22px", color: C.tertiaryText }}>Add a comment…</span>
              <div style={{ width: 32, height: 32, marginBottom: 4, borderRadius: 999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
                <ArrowUp size={18} color={C.primaryFg} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
