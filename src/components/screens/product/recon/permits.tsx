"use client";

/**
 * Permits mode over Young County on satellite, played forward on a loop: the
 * county at cluster zoom with its pending, approved and drilled permits, the camera easing in toward Harlan Ranch 3 west of Graham, its pin coming up,
 * the pointer pressing it and the app's `PermitPanel` sliding in with the
 * approved permit, its days since issue and the W-1 and plats the RRC
 * published; the W-1 opened, then the lease plat; the panel's own Close pressed; the camera
 * easing back out to the county.
 *
 * The panel is the app's, opened and closed through `ReconMapScene`'s
 * scripted `permitOpen`; the close is a press on the panel's own Close
 * button, which runs its `onClose`.
 */
import { useEffect, useRef, useState } from "react";
import { PERMIT_LNG_LAT, reconFilters, reconPermitWithFile } from "@/lib/screens/recon-fixture";
import type { ReconMapHandle } from "../../recon-map";
import { useDemoActive } from "../../demo-active";
import { ReconMapScene } from "./map-scene";
import { DemoCursor, centreOf, toCanvas, type CursorPoint } from "./cursor";
import { LeasePlat, PdfTab, W1Page } from "./permit-file";

/** Young County whole, Graham a little right of centre. */
const COUNTY = { center: [-98.69, 33.18] as [number, number], zoom: 8.7 };
/** East of the pin, so the pin sits clear of the panel once it opens. */
const PERMIT = { center: [PERMIT_LNG_LAT[0] + 0.094, PERMIT_LNG_LAT[1] + 0.002] as [number, number], zoom: 10.8 };

/**
 * `county` holds the county with its permits drawn; `fly` eases in; `pin`
 * brings the pin up; `aim` moves the pointer to it; `press` rings it; `open`
 * slides the panel in; `toW1` and `w1` press the panel's W-1 row and its PDF
 * opens; `toPlat` and `plat` do the same for the lease plat; `toClose` moves
 * the pointer to Close; `close` presses it and the panel slides out; `back`
 * eases out to the county.
 */
type Phase =
  | "county"
  | "fly"
  | "pin"
  | "aim"
  | "press"
  | "open"
  | "toW1"
  | "w1"
  | "toPlat"
  | "plat"
  | "toClose"
  | "close"
  | "back";

const HOLD: Record<Phase, number> = {
  county: 2600,
  fly: 3600,
  pin: 1400,
  aim: 1100,
  press: 600,
  open: 2600,
  toW1: 1000,
  w1: 5200,
  toPlat: 1200,
  plat: 4600,
  toClose: 1100,
  close: 1200,
  back: 3600,
};
const NEXT: Record<Phase, Phase> = {
  county: "fly",
  fly: "pin",
  pin: "aim",
  aim: "press",
  press: "open",
  open: "toW1",
  toW1: "w1",
  w1: "toPlat",
  toPlat: "plat",
  plat: "toClose",
  toClose: "close",
  close: "back",
  back: "county",
};

export function ReconPermitsScreen() {
  const active = useDemoActive();
  const [phase, setPhase] = useState<Phase>("county");
  /** Set by the panel's own Close, through its `onClose`. */
  const [closed, setClosed] = useState(false);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);
  const map = useRef<ReconMapHandle | null>(null);
  const root = useRef<HTMLDivElement>(null);

  /** The clock waits for the wells, so the county is held on a drawn map. */
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (!active || !drawn) return;
    const id = setTimeout(() => {
      const next = NEXT[phase];
      // A new loop starts with the panel shut until its press.
      if (next === "county") setClosed(false);
      setPhase(next);
    }, HOLD[phase]);
    return () => clearTimeout(id);
  }, [active, drawn, phase]);

  useEffect(() => {
    if (!active) return;
    const docRow = (kind: string) =>
      Array.from(root.current?.parentElement?.querySelectorAll<HTMLElement>("[data-permit-stack] a") ?? []).find((a) =>
        (a.textContent ?? "").trim().startsWith(kind)
      );
    const aimAt = (el: Element | undefined) => {
      const c = centreOf(el);
      if (c) setCursor({ ...c, down: false });
    };
    const frame = requestAnimationFrame(() => {
      const m = map.current;
      const pane = root.current?.parentElement?.querySelector(".mapboxgl-map")?.getBoundingClientRect();
      switch (phase) {
        case "county":
          m?.highlight(null);
          setCursor(null);
          break;
        case "fly": {
          m?.flyTo({ ...PERMIT, duration: HOLD.fly - 300 });
          // In from the lower right, so the aim reads as a move.
          const c = pane && toCanvas(root.current, pane.left + pane.width * 0.78, pane.top + pane.height * 0.85);
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "aim": {
          // `project` is in the map's own pixels from its corner.
          const p = m?.project(PERMIT_LNG_LAT);
          const origin = pane && toCanvas(root.current, pane.left, pane.top);
          if (p && origin) setCursor({ x: origin.x + p.x, y: origin.y + p.y - 8, down: false });
          break;
        }
        case "press":
          m?.highlight(PERMIT_LNG_LAT);
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "open":
          setCursor((c) => (c ? { ...c, down: false } : c));
          break;
        case "toW1":
          aimAt(docRow("W-1"));
          break;
        case "toPlat":
          aimAt(docRow("Plat"));
          break;
        case "w1":
        case "plat":
          // The row is a link to the RRC's PDF; the tab it opens is drawn
          // here (`PdfTab`) rather than followed.
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "toClose": {
          const c = centreOf(root.current?.parentElement?.querySelector('[data-permit-stack] button[aria-label="Close"]'));
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "close": {
          setCursor((c) => (c ? { ...c, down: true } : c));
          // The panel's own Close, so its `onClose` runs.
          root.current?.parentElement?.querySelector<HTMLButtonElement>('[data-permit-stack] button[aria-label="Close"]')?.click();
          m?.highlight(null);
          break;
        }
        case "back":
          setCursor(null);
          m?.flyTo({ ...COUNTY, duration: HOLD.back - 300 });
          break;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [active, phase]);

  const open =
    !closed && ["open", "toW1", "w1", "toPlat", "plat", "toClose", "close"].includes(phase);
  const doc = phase === "w1" ? "w1" : phase === "plat" ? "plat" : null;
  const pinShown = phase !== "county" && phase !== "fly" && phase !== "back";

  return (
    <ReconMapScene
      filters={reconFilters}
      center={COUNTY.center}
      zoom={COUNTY.zoom}
      permit={reconPermitWithFile}
      pin={{ lngLat: PERMIT_LNG_LAT, color: "#111827", label: "Harlan Ranch 3" }}
      permitOpen={open}
      onPermitClose={() => setClosed(true)}
      pinShown={pinShown}
      onMapReady={(h) => (map.current = h)}
      onMapDrawn={() => setDrawn(true)}
    >
      <div ref={root} data-phase={phase} className="hidden" />
      {doc === "w1" && (
        <PdfTab fileName="0912417_W1_HARLAN RANCH 3 W-1 Application.pdf" pages={1}>
          <W1Page />
        </PdfTab>
      )}
      {doc === "plat" && (
        <PdfTab fileName="0912417_Plat_HARLAN RANCH 3 Lease Plat.pdf" pages={1}>
          <LeasePlat />
        </PdfTab>
      )}
      {cursor && <DemoCursor {...cursor} />}
    </ReconMapScene>
  );
}
