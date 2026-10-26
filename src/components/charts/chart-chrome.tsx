"use client";

/**
 * The chrome every dated chart card wears: the time-range presets, the settings
 * popover's custom-range fields, the fullscreen toggle, and the fullscreen
 * overlay itself.
 *
 * Lifted out of `@/components/wells/production-chart` so the SWD disposal chart
 * wears the SAME controls rather than a lookalike — same presets, same 28px
 * icon buttons, same GSAP fly-in. A reader who learns the oil chart's header on
 * a well page already knows the saltwater meter's.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Maximize2Icon, Minimize2Icon, Settings2Icon } from "lucide-react";
import { ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { AVERAGE_LINE_COLOR, AVERAGE_LINE_DASH } from "@/lib/charts/average";
import { PRODUCTION_RANGES, type CustomRange } from "@/lib/charts/ranges";
import { cn } from "@/lib/utils";

/**
 * One averaged series: what the line is drawn at and how its value reads in
 * the tooltip. `value` null draws nothing (no rows to average).
 */
export interface AverageSpec {
  /** Tooltip row label: "Average", or "Oil average" when a chart averages two series. */
  label: string;
  value: number | null;
  /** Red unless a chart's secondary series wants its own color. */
  color?: string;
  /** The axis the line belongs to on a dual-axis chart. */
  yAxisId?: string | number;
  /** Formats the value the way the series it averages is formatted. */
  format?: (value: number) => string;
}

/** The same number formatting the tooltip's own rows use when a chart sets no formatter. */
export function defaultAverageFormat(value: number): string {
  return value.toLocaleString();
}

/**
 * The horizontal mean line. Recharts 3 reads chart children through context,
 * so wrapping `ReferenceLine` in a component is safe (it was not in v2, where
 * the chart introspected its children by display name).
 */
export function AverageLine({ spec }: { spec: AverageSpec }) {
  if (spec.value == null) return null;
  return (
    <ReferenceLine
      y={spec.value}
      {...(spec.yAxisId !== undefined ? { yAxisId: spec.yAxisId } : {})}
      stroke={spec.color ?? AVERAGE_LINE_COLOR}
      strokeDasharray={AVERAGE_LINE_DASH}
      strokeWidth={1.5}
      ifOverflow="extendDomain"
    />
  );
}

/**
 * The tooltip's "Average" rows, for `ChartTooltipContent`'s `footer` prop.
 * Rendered inside the footer's own flex row, so one spec is a label/value pair
 * and several stack as a column. Null when nothing is averaged, which draws no
 * footer rule at all.
 */
export function averageFooter(specs: readonly AverageSpec[]): ReactNode {
  const drawn = specs.filter((s) => s.value != null);
  if (drawn.length === 0) return null;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {drawn.map((s) => (
        <div key={s.label} className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-0 w-3 border-t-[1.5px] border-dashed"
              style={{ borderColor: s.color ?? AVERAGE_LINE_COLOR }}
            />
            {s.label}
          </span>
          <span className="font-mono font-medium tabular-nums text-foreground">
            {(s.format ?? defaultAverageFormat)(s.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The legend entry for an average line, in the shape every chart's legend row takes. */
export function averageLegendItem(spec: AverageSpec): { key: string; label: string; color: string } {
  return { key: `avg:${spec.label}`, label: spec.label, color: spec.color ?? AVERAGE_LINE_COLOR };
}

/** The "Average" switch every chart's settings popover carries. */
export function AverageSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span>Average</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label="Average line" />
    </label>
  );
}

/**
 * The gear button and its popover, for charts that had no settings before the
 * average line gave them one. The facility and SWD charts build the same
 * trigger inline because their popovers hold more; keep the two looking alike.
 */
export function ChartSettingsPopover({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Chart settings"
        className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Settings2Icon className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 space-y-3 text-sm">
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** The preset window buttons (1M … All). */
export function RangePresets({
  range,
  onChange,
}: {
  range: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Select time range"
      className="inline-flex items-center gap-0.5 rounded-sm bg-muted p-0.5"
    >
      {PRODUCTION_RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={range === r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
            range === r.value &&
              "bg-background text-foreground shadow-sm hover:text-foreground"
          )}
        >
          {r.value}
        </button>
      ))}
    </div>
  );
}

/** The custom-range block inside a chart's settings popover. */
export function CustomRangeFields({
  custom,
  onChange,
}: {
  custom: CustomRange | null;
  onChange: (next: CustomRange | null) => void;
}) {
  return (
    <div className="space-y-1.5 border-t pt-2">
      <span className="text-xs text-muted-foreground">Custom range</span>
      <div className="flex flex-col gap-1.5">
        <DatePicker
          value={custom?.from ? parseISO(custom.from) : null}
          placeholder="Range start"
          className="w-full"
          onChange={(d) => {
            const from = d ? format(d, "yyyy-MM-dd") : "";
            onChange({ from, to: custom?.to ?? from });
          }}
        />
        <DatePicker
          value={custom?.to ? parseISO(custom.to) : null}
          placeholder="Range end"
          className="w-full"
          onChange={(d) => {
            const to = d ? format(d, "yyyy-MM-dd") : "";
            onChange({ from: custom?.from ?? to, to });
          }}
        />
      </div>
      {custom ? (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onChange(null)}
        >
          Clear custom range
        </button>
      ) : null}
    </div>
  );
}

export interface FullscreenCard {
  fullscreen: boolean;
  toggle: () => void;
  mounted: boolean;
  backdropRef: RefObject<HTMLDivElement | null>;
  cardRef: RefObject<HTMLDivElement | null>;
}

/**
 * Fullscreen state plus its fly-in (mirrors the SwipeUpModal GSAP animation).
 * The overlay mounts as soon as fullscreen opens and unmounts itself when the
 * exit animation completes, so the card is never yanked mid-flight.
 */
export function useFullscreenCard(): FullscreenCard {
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Render-time derived state, no effect.
  if (fullscreen && !mounted) setMounted(true);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const backdrop = backdropRef.current;
    const card = cardRef.current;
    if (!backdrop || !card) return;
    if (fullscreen) {
      const tl = gsap.timeline();
      tl.fromTo(
        backdrop,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.3, ease: "power2.out" }
      ).fromTo(
        card,
        { yPercent: 100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" },
        "<"
      );
    } else {
      const tl = gsap.timeline({ onComplete: () => setMounted(false) });
      tl.to(card, {
        yPercent: 100,
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
      }).to(
        backdrop,
        { autoAlpha: 0, duration: 0.25, ease: "power2.in" },
        "<"
      );
    }
  }, [fullscreen, mounted]);

  return {
    fullscreen,
    toggle: () => setFullscreen((f) => !f),
    mounted,
    backdropRef,
    cardRef,
  };
}

/** The 28px icon button that opens and closes fullscreen. */
export function FullscreenToggle({ fs }: { fs: FullscreenCard }) {
  return (
    <button
      type="button"
      aria-label={fs.fullscreen ? "Exit fullscreen" : "Fullscreen"}
      onClick={fs.toggle}
      className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {fs.fullscreen ? (
        <Minimize2Icon className="size-4" />
      ) : (
        <Maximize2Icon className="size-4" />
      )}
    </button>
  );
}

/** The full-viewport card, portalled to the body. Renders nothing when closed. */
export function FullscreenChartOverlay({
  fs,
  header,
  children,
}: {
  fs: FullscreenCard;
  header: ReactNode;
  children: ReactNode;
}) {
  const { backdropRef, cardRef } = fs;
  if (!fs.mounted || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div ref={backdropRef} className="absolute inset-0 bg-background" />
      <Card
        ref={cardRef}
        className="relative flex h-full w-full flex-col rounded-none border-0"
      >
        {header}
        <CardContent className="min-h-0 flex-1">{children}</CardContent>
      </Card>
    </div>,
    document.body
  );
}
