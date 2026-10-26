/**
 * RRC well symbols for the Recon maps.
 *
 * The Railroad Commission's Public GIS Viewer draws every wellbore from a base
 * mark for its class and a modifier for its state, and an operator who reads
 * that viewer every week reads ours the same way if we use the same marks:
 *
 *   base      oil = solid green dot · gas = hollow red circle with rays ·
 *             dry hole = hollow blue circle with four spokes ·
 *             location (no class) = hollow blue circle
 *   modifier  plugged = a thin diagonal through the mark, upper left to lower
 *             right · injection/disposal = that same diagonal with an arrowhead
 *             at its lower-right end · shut-in = a bar across the mark's
 *             middle, with an oil dot filled above the bar only and a gas
 *             circle's rays kept below it only
 *
 * Checked against the legend's own pixels, not just its wording: the marks
 * were rendered beside 600 dpi crops of the printed legend and adjusted until
 * they matched (the diagonal runs \ not /, the arrow is the diagonal's own
 * end, the gas rays are short ticks).
 *
 * Source: the viewer's printed legend (June 2026) and Appendix A of the RRC
 * Digital Map Information User Guide. Storage, water-supply, brine, observation
 * and service wells carry letter prefixes there; the points file does not yet
 * tell those apart from other injectors, so they draw as injection/disposal.
 *
 * THE RULE IS ONE TABLE. `wellGlyph` (TypeScript, for the legend and tests)
 * and `WELL_GLYPH_EXPRESSION` (a Mapbox expression, for the layers) are both
 * generated from `GLYPH_RULES`, so a well cannot be one mark on the map and
 * another in the key.
 *
 * The flags are the ones the tiles already carry (`live-tiler.ts`): `og`
 * "O" | "G" | "" , and `plug`, `dead`, `swd` as 0/1. Precedence is plugged,
 * then stopped, then injecting, then producing: a plugged injector is plugged,
 * and a shut-in injector has stopped.
 */

export type WellGlyphId =
  | "rrc-oil"
  | "rrc-gas"
  | "rrc-loc"
  | "rrc-dry"
  | "rrc-oil-plugged"
  | "rrc-gas-plugged"
  | "rrc-oil-shutin"
  | "rrc-gas-shutin"
  | "rrc-loc-shutin"
  | "rrc-oil-inj"
  | "rrc-gas-inj"
  | "rrc-inj";

/** The flags a well point carries, as the tiles and the focus layer spell them. */
export interface WellGlyphInput {
  og: string | null | undefined;
  plug?: number | boolean | null;
  dead?: number | boolean | null;
  swd?: number | boolean | null;
}

type Rule = {
  /** Which flag decides this row; `null` is the final, unconditional row. */
  flag: "plug" | "dead" | "swd" | null;
  /** The mark for an oil well, a gas well, and a hole with no class. */
  oil: WellGlyphId;
  gas: WellGlyphId;
  none: WellGlyphId;
};

/** In precedence order: the first row whose flag is set wins. */
const GLYPH_RULES: Rule[] = [
  // A dry hole IS a plugged well that never produced: no class, plugged.
  { flag: "plug", oil: "rrc-oil-plugged", gas: "rrc-gas-plugged", none: "rrc-dry" },
  { flag: "dead", oil: "rrc-oil-shutin", gas: "rrc-gas-shutin", none: "rrc-loc-shutin" },
  { flag: "swd", oil: "rrc-oil-inj", gas: "rrc-gas-inj", none: "rrc-inj" },
  { flag: null, oil: "rrc-oil", gas: "rrc-gas", none: "rrc-loc" },
];

const on = (v: number | boolean | null | undefined) => v === 1 || v === true;

/** The mark for one well. */
export function wellGlyph(w: WellGlyphInput): WellGlyphId {
  const og = (w.og ?? "").toUpperCase();
  for (const rule of GLYPH_RULES) {
    if (rule.flag && !on(w[rule.flag])) continue;
    if (og === "O") return rule.oil;
    if (og === "G") return rule.gas;
    return rule.none;
  }
  // Unreachable: the last rule has no flag.
  return "rrc-loc";
}

/**
 * The same rule as a Mapbox `icon-image` expression over the feature's
 * `og` / `plug` / `dead` / `swd` properties. Flags are compared to 1, so a
 * missing property (an older focus result with no `plug`) simply reads as off.
 */
export const WELL_GLYPH_EXPRESSION: unknown[] = (() => {
  const pick = (r: Rule): unknown[] => [
    "case",
    ["==", ["get", "og"], "O"],
    r.oil,
    ["==", ["get", "og"], "G"],
    r.gas,
    r.none,
  ];
  const expr: unknown[] = ["case"];
  for (const rule of GLYPH_RULES) {
    if (rule.flag) expr.push(["==", ["get", rule.flag], 1], pick(rule));
    else expr.push(pick(rule));
  }
  return expr;
})();

/** Every mark, in the order the key lists them. */
export const WELL_GLYPH_IDS: WellGlyphId[] = [
  "rrc-oil",
  "rrc-gas",
  "rrc-loc",
  "rrc-dry",
  "rrc-oil-plugged",
  "rrc-gas-plugged",
  "rrc-oil-shutin",
  "rrc-gas-shutin",
  "rrc-loc-shutin",
  "rrc-oil-inj",
  "rrc-gas-inj",
  "rrc-inj",
];

/** What the key calls each mark, as the RRC legend words it. */
export const WELL_GLYPH_LABEL: Record<WellGlyphId, string> = {
  "rrc-oil": "Oil",
  "rrc-gas": "Gas",
  "rrc-loc": "Location",
  "rrc-dry": "Dry hole",
  "rrc-oil-plugged": "Plugged oil",
  "rrc-gas-plugged": "Plugged gas",
  "rrc-oil-shutin": "Shut-in oil",
  "rrc-gas-shutin": "Shut-in gas",
  "rrc-loc-shutin": "Shut-in",
  "rrc-oil-inj": "Injection / disposal from oil",
  "rrc-gas-inj": "Injection / disposal from gas",
  "rrc-inj": "Injection / disposal",
};

/* ---------------------------------------------------------------- drawing */

/** The RRC viewer's own three inks: blue for no class, green oil, red gas. */
const INK = { blue: "#2563eb", green: "#16a34a", red: "#dc2626" } as const;

/**
 * The mark in CSS pixels at scale 1: a circle of radius 5.5 (the viewer's
 * 11px dot), rays and spokes reaching 9.5, the slash and the arrow past that.
 * `GLYPH_PX` is the square that holds every part of every mark with a halo.
 */
export const GLYPH_PX = 24;
const R = 5.5;
const REACH = 9.5;

type Parts = {
  ink: string;
  base: "dot" | "ring" | "rays" | "spokes";
  slash?: boolean;
  half?: boolean;
  arrow?: boolean;
};

function partsOf(id: WellGlyphId): Parts {
  const cls = id.includes("-oil") ? "oil" : id.includes("-gas") ? "gas" : "none";
  const ink = cls === "oil" ? INK.green : cls === "gas" ? INK.red : INK.blue;
  const base: Parts["base"] =
    cls === "oil" ? "dot" : cls === "gas" ? "rays" : id === "rrc-dry" ? "spokes" : "ring";
  return {
    ink,
    base,
    slash: id.endsWith("-plugged"),
    half: id.endsWith("-shutin"),
    arrow: id.endsWith("-inj"),
  };
}

/**
 * Draw one mark centred on (cx, cy). `halo` draws it a second time underneath
 * in white, wider, so the mark stays legible over imagery and over other marks.
 */
export function paintWellGlyph(
  ctx: CanvasRenderingContext2D,
  id: WellGlyphId,
  cx: number,
  cy: number,
  scale = 1
) {
  const p = partsOf(id);
  const r = R * scale;
  const reach = REACH * scale;
  const line = 1.6 * scale;

  const pass = (color: string, extra: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = line + extra;
    ctx.lineCap = "round";

    // Shut-in: a bar across the middle. The outline stays whole; an oil dot
    // is filled above the bar only, and a gas circle keeps its rays below it
    // only, which is how the legend draws both.
    if (p.half) {
      ctx.beginPath();
      ctx.moveTo(-reach, 0);
      ctx.lineTo(reach, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      if (p.base === "dot") {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-reach - extra, -reach - extra, 2 * (reach + extra), reach + extra);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(0, 0, r + extra / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (p.base === "rays") {
        for (const a of [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (r + 1 * scale), Math.sin(a) * (r + 1 * scale));
          ctx.lineTo(Math.cos(a) * (r + 3.5 * scale), Math.sin(a) * (r + 3.5 * scale));
          ctx.stroke();
        }
      }
      ctx.restore();
      return;
    }

    // Base mark.
    ctx.beginPath();
    ctx.arc(0, 0, r + (p.base === "dot" ? extra / 2 : 0), 0, Math.PI * 2);
    if (p.base === "dot") ctx.fill();
    else ctx.stroke();
    if (p.base === "rays") {
      // Six short ticks, about half a radius long: top, bottom and the four
      // diagonals, none at the sides, the way the legend draws them.
      for (const a of [-Math.PI / 2, -Math.PI / 4, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, (5 * Math.PI) / 4]) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r + 1 * scale), Math.sin(a) * (r + 1 * scale));
        ctx.lineTo(Math.cos(a) * (r + 3.5 * scale), Math.sin(a) * (r + 3.5 * scale));
        ctx.stroke();
      }
    }
    if (p.base === "spokes") {
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a) * reach, Math.sin(a) * reach);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Modifiers, outside the clip so a slash or an arrow is never cut off.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = line + extra;
    ctx.lineCap = "round";
    // Plugged and injecting share one stroke: a thin diagonal from above the
    // upper left to below the lower right, through the centre. Injecting
    // puts an arrowhead on its lower end; plugged leaves it bare.
    if (p.slash || p.arrow) {
      // Plugged is a short stroke that only just clears the circle; injecting
      // runs well past it and ends in a head big enough to read at map size.
      // The two must differ at a glance, not only when zoomed.
      const from = p.arrow ? -r * 0.9 : -r * 1.25;
      const to = p.arrow ? reach + 2.5 * scale : r * 1.25;
      ctx.lineWidth = line * 0.85 + extra;
      ctx.beginPath();
      ctx.moveTo(from, from);
      ctx.lineTo(to, to);
      ctx.stroke();
      if (p.arrow) {
        const head = 5 * scale;
        ctx.beginPath();
        ctx.moveTo(to, to);
        ctx.lineTo(to - head, to - head * 0.3);
        ctx.lineTo(to - head * 0.3, to - head);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  };

  pass("#ffffff", 2.4 * scale);
  pass(p.ink, 0);
}

/**
 * One mark as pixels, for `map.addImage`. Drawn at `ratio` device pixels per
 * CSS pixel so it stays crisp on a retina screen; the map is told the ratio
 * and sizes it back down.
 */
export function wellGlyphImage(id: WellGlyphId, ratio = 2): ImageData {
  const px = GLYPH_PX * ratio;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  paintWellGlyph(ctx, id, px / 2, px / 2, ratio);
  return ctx.getImageData(0, 0, px, px);
}

/** One mark as a data URL, for an `<img>` in the key. */
export function wellGlyphDataUrl(id: WellGlyphId, ratio = 2): string {
  const px = GLYPH_PX * ratio;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  paintWellGlyph(ctx, id, px / 2, px / 2, ratio);
  return canvas.toDataURL("image/png");
}

/**
 * Register every mark with a map. Called on each `style.load`: a basemap swap
 * throws the images away with the layers.
 */
export function addWellGlyphs(map: {
  hasImage: (id: string) => boolean;
  addImage: (id: string, image: ImageData, options?: { pixelRatio?: number }) => void;
}) {
  const ratio = 2;
  for (const id of WELL_GLYPH_IDS) {
    if (map.hasImage(id)) continue;
    map.addImage(id, wellGlyphImage(id, ratio), { pixelRatio: ratio });
  }
}

/**
 * How big a mark draws, by zoom: the viewer's full size once the map is close
 * enough to read individual wells, half that where the bubbles have only just
 * broken into dots. Shared by every well layer so the page map and a dossier
 * agree on what a well looks like.
 */
export const WELL_GLYPH_SIZE: unknown[] = [
  "interpolate",
  ["linear"],
  ["zoom"],
  6,
  0.5,
  13,
  1,
  16,
  1.3,
];

/** The layout a well symbol layer needs: the marks, never hidden by collision. */
export function wellGlyphLayout(): Record<string, unknown> {
  return {
    "icon-image": WELL_GLYPH_EXPRESSION,
    "icon-size": WELL_GLYPH_SIZE,
    // Wells sit on top of one another on a pad; a mark dropped for lack of
    // room would be a well that is not on the map.
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
    "icon-padding": 0,
  };
}
