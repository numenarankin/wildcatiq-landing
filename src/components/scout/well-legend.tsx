"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  GLYPH_PX,
  WELL_GLYPH_LABEL,
  wellGlyphDataUrl,
  type WellGlyphId,
} from "@/lib/scout/well-glyphs";

/*
 * Key for the Wells mode: the RRC marks the wells are drawn in. The marks are
 * the same pixels the map draws (`well-glyphs.ts`), so the key is never a
 * drawing of a different symbol.
 *
 * Six rows rather than the twelve marks: the modifier is the same slash, half
 * or arrow on every class, so one row per modifier shows the grammar and the
 * oil and gas marks beside it show the classes.
 */
const ROWS: { ids: WellGlyphId[]; label: string }[] = [
  { ids: ["rrc-oil"], label: WELL_GLYPH_LABEL["rrc-oil"] },
  { ids: ["rrc-gas"], label: WELL_GLYPH_LABEL["rrc-gas"] },
  { ids: ["rrc-loc"], label: "No class on file" },
  { ids: ["rrc-dry"], label: WELL_GLYPH_LABEL["rrc-dry"] },
  { ids: ["rrc-oil-shutin", "rrc-gas-shutin"], label: "Shut-in" },
  { ids: ["rrc-oil-plugged", "rrc-gas-plugged"], label: "Plugged" },
  { ids: ["rrc-oil-inj", "rrc-gas-inj"], label: "Injection / disposal" },
];

function Mark({ id, urls }: { id: WellGlyphId; urls: Record<string, string> }) {
  // Drawn at 2x and shown at 1x, the size the map draws it at full zoom.
  return (
    <span
      aria-hidden
      className="-m-1 inline-block bg-center bg-no-repeat"
      style={{
        width: GLYPH_PX,
        height: GLYPH_PX,
        backgroundSize: `${GLYPH_PX}px ${GLYPH_PX}px`,
        backgroundImage: urls[id] ? `url(${urls[id]})` : undefined,
      }}
    />
  );
}

export function WellLegend() {
  // landing: the app mounts the key only once its map has drawn, on the client.
  // The landing server-renders it, so a `useState` initializer drew empty marks
  // on the server and hydration kept that markup (React does not patch a
  // mismatched style attribute): the labels showed with no symbols. The marks
  // are now painted only once hydrated.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const urls = useMemo(() => {
    const out: Record<string, string> = {};
    if (!hydrated) return out;
    for (const row of ROWS) for (const id of row.ids) out[id] = wellGlyphDataUrl(id);
    return out;
  }, [hydrated]);

  return (
    <div className="absolute bottom-8 left-3 z-10 flex flex-col gap-1 rounded-lg border bg-background/95 p-2.5 text-xs shadow-lg backdrop-blur">
      {ROWS.map((row) => (
        <div key={row.label} className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5">
            {row.ids.map((id) => (
              <Mark key={id} id={id} urls={urls} />
            ))}
          </span>
          <span className="text-muted-foreground">{row.label}</span>
        </div>
      ))}
    </div>
  );
}
