"use client";

/**
 * The shared kit every phone transcription draws with: the phone's tokens
 * (wildcat-phone src/config/theme.ts `colors`, `typography.label`,
 * `metrics.headerHeight`), the device bezel and OS status bar the hero uses
 * (mobile-screen.tsx), the app header (src/components/shell/app-header.tsx:
 * 56pt bar, back caret left, centred mark or page title, nine-dot launcher
 * right).
 *
 * Each screen is a DOM transcription at the phone's pixel values inside a
 * 390 x 844 canvas. Nothing is imported from wildcat-phone.
 */
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { ScaledScreen } from "../../shell";

/** wildcat-phone src/config/theme.ts `colors`. */
export const C = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  card: "#ffffff",
  primary: "#171717",
  primaryFg: "#fafafa",
  secondary: "#f5f5f5",
  muted: "#f5f5f5",
  mutedFg: "#737373",
  accent: "#f5f5f5",
  border: "#e5e5e5",
  input: "#e5e5e5",
  ring: "#a1a1a1",
  destructive: "#e7000b",
  secondaryText: "#555555",
  tertiaryText: "#737373",
  bgSubtle: "#f5f5f5",
  dataAccent: "#2e64ea",
  error: "#df2225",
  info: "#1a83db",
  warning: "#dc8900",
  success: "#25984d",
} as const;

/** theme.ts `chart`. */
export const CHART = {
  oil: "#059669",
  gas: "#800000",
  water: "#4169e1",
  ema7: "#f59e0b",
  ema14: "#7c3aed",
  negative: "#dc2626",
} as const;

/** theme.ts `radius`. */
export const RADIUS = { card: 2.4, sm: 6, md: 8, lg: 10, xl: 14, xxl: 18, pill: 999 } as const;

/**
 * The phone app's own font files (mobile-background, @expo-google-fonts figtree
 * and geist-mono, copied to public/fonts/phone). The site's next/font Figtree is
 * a different build and sets text about 1.5% wider, which re-wraps lines the
 * app does not wrap. Rendered by every phone frame.
 */
const face = (family: string, file: string, weight: number) =>
  `@font-face { font-family: "${family}"; src: url("/fonts/phone/${file}.ttf") format("truetype"); font-weight: ${weight}; font-display: swap; }`;
export const PHONE_FONTS = [
  face("Phone Figtree", "Figtree_400Regular", 400),
  face("Phone Figtree", "Figtree_500Medium", 500),
  face("Phone Figtree", "Figtree_600SemiBold", 600),
  face("Phone Figtree", "Figtree_700Bold", 700),
  face("Phone Geist Mono", "GeistMono_400Regular", 400),
  face("Phone Geist Mono", "GeistMono_600SemiBold", 600),
].join("\n");

export const SANS = "\"Phone Figtree\", var(--font-sans), system-ui, sans-serif";
export const MONO = "\"Phone Geist Mono\", var(--font-geist-mono), ui-monospace, monospace";

/** theme.ts `typography.label`. */
export const LABEL: React.CSSProperties = {
  fontFamily: MONO,
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: C.mutedFg,
};

/** theme.ts `typography.microLabel`. */
export const MICRO_LABEL: React.CSSProperties = {
  fontFamily: MONO,
  fontWeight: 400,
  fontSize: 11,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: C.mutedFg,
};

/** theme.ts `elevation.cardRing`: a hairline foreground/12 ring, no shadow. */
export const CARD_RING: React.CSSProperties = { border: "0.5px solid rgba(10,10,10,0.12)" };

export const STATUS_BAR_H = 54;
export const HEADER_H = 56;
/** Status bar less `metrics.headerStatusTrim` (8), plus the 56pt bar: where page content starts. */
export const CONTENT_TOP = STATUS_BAR_H - 8 + HEADER_H;

/** The OS status bar; `ink` turns it white over a camera, as iOS does. */
export function StatusBar({ time, ink = C.foreground }: { time: string; ink?: string }) {
  return (
    <div style={{ height: STATUS_BAR_H, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 6px", fontSize: 15, fontWeight: 600, color: ink }}>
      <span>{time}</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill={ink} aria-hidden><rect x="0" y="8" width="3" height="4" rx="0.5" /><rect x="5" y="5" width="3" height="7" rx="0.5" /><rect x="10" y="2.5" width="3" height="9.5" rx="0.5" /><rect x="15" y="0" width="3" height="12" rx="0.5" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={ink} opacity="0.35" /><rect x="2" y="2" width="20" height="9" rx="2" fill={ink} /><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill={ink} opacity="0.4" /></svg>
      </span>
    </div>
  );
}

/** A status bar with no service: the signal bars hollow, as iOS draws it. */
function StatusBarOffline({ time }: { time: string }) {
  return (
    <div style={{ height: STATUS_BAR_H, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 6px", fontSize: 15, fontWeight: 600, color: C.foreground }}>
      <span>{time}</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="18" height="12" viewBox="0 0 18 12" fill={C.foreground} opacity="0.3" aria-hidden><rect x="0" y="8" width="3" height="4" rx="0.5" /><rect x="5" y="5" width="3" height="7" rx="0.5" /><rect x="10" y="2.5" width="3" height="9.5" rx="0.5" /><rect x="15" y="0" width="3" height="12" rx="0.5" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={C.foreground} opacity="0.35" /><rect x="2" y="2" width="14" height="9" rx="2" fill={C.foreground} /><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill={C.foreground} opacity="0.4" /></svg>
      </span>
    </div>
  );
}

/** The nine-dot launcher glyph (untitled-icons DotsGrid), 20px. */
function DotsGrid() {
  const dots = [5, 12, 19];
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={C.foreground} aria-hidden>
      {dots.flatMap((y) => dots.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  );
}

/**
 * app-header.tsx: a 56pt bar, horizontal padding 16 on a phone. Left: the back
 * caret (26px) when the user stepped here from somewhere. Centre: the page's
 * own title when it sets one (`useHeaderTitle`), else the 20px mark. Right:
 * the launcher in a 40px ghost icon button.
 */
export function AppHeader({ back = false, title }: { back?: boolean; title?: string }) {
  return (
    <div style={{ position: "relative", height: HEADER_H, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 16px", background: C.background }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {back ? (
          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 4 }}>
            <ChevronLeft size={26} color={C.foreground} />
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, pointerEvents: "none" }}>
        {title ? (
          <span style={{ fontWeight: 600, fontSize: 16, color: C.foreground, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        ) : (
          <Image src="/slim_normal.png" alt="" width={20} height={20} />
        )}
      </div>
      <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DotsGrid />
      </div>
    </div>
  );
}

/**
 * src/components/shell/offline-banner.tsx over sync-status.ts
 * `describeSyncState` for a phone with no signal and nothing queued: under the
 * header, centred, a foreground bar with its bottom corners rounded 8, medium 12
 * text in the background colour.
 */
export function OfflineBanner({ text = "Offline · showing saved data" }: { text?: string }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: HEADER_H, zIndex: 9, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 14px", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, maxWidth: "96%", background: C.foreground }}>
        <span style={{ fontWeight: 500, fontSize: 12, color: C.background, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</span>
      </div>
    </div>
  );
}

export function HomeIndicator() {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 40 }}>
      <div style={{ width: 134, height: 5, borderRadius: 3, background: C.foreground, opacity: 0.9 }} />
    </div>
  );
}

/**
 * The device: an 8px bezel with 44px corners around a 390 x 844 canvas,
 * the OS status bar on top and the home indicator at the foot. `children`
 * fill the space under the status bar.
 */
export function PhoneFrame({ time = "7:41", offline = false, children, style }: { time?: string; offline?: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="mx-auto w-full max-w-[290px] overflow-hidden rounded-[44px] border-[8px] border-neutral-900 bg-neutral-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
      <style>{PHONE_FONTS}</style>
      <div className="overflow-hidden rounded-[36px]">
        <ScaledScreen w={390} h={844}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", background: C.background, color: C.foreground, fontFamily: SANS, lineHeight: "normal", overflow: "hidden", ...style }}>
            {offline ? <StatusBarOffline time={time} /> : <StatusBar time={time} />}
            <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>
            <HomeIndicator />
          </div>
        </ScaledScreen>
      </div>
    </div>
  );
}

/** A bottom sheet card (SwipeUpModal on the phone): 18 radius top corners, 64 x 6 grab handle. */
export function SheetCard({ children, height, style }: { children: React.ReactNode; height?: number | string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 20 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)" }} />
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          background: C.background,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          ...style,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 64, height: 6, borderRadius: 999, background: C.border }} />
        </div>
        {children}
      </div>
    </div>
  );
}
