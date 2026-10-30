/**
 * The Orion log screen's fixture: Jim attaches Smith 4's LAS from his files
 * and asks for tops, pay and a recompletion call. Orion finds the file
 * (`browse_files`, since a knowledge-base attachment reaches the model as its
 * name only), reads it whole (`read_las_full`) and answers.
 *
 * Every number in the answer is computed here from the same synthetic curves
 * the phone's LAS screen draws (`smith4Las()` in mobile-b-fixture.ts), the way
 * the app tells Orion to work: on the returned rows, never estimated. The
 * rules, all stated in the answer:
 *
 * - Tops: GR averaged over a 10 ft window (21 half-foot samples), and a top
 *   wherever that average crosses 85 API and stays across for 30 ft. 85 sits
 *   between this log's clean rock (30 to 70) and its shales (100 to 140).
 *   The clean breaks are named shallow to deep in the order a Graham-area
 *   section stacks them, and the shale break under the Bend Conglomerate is
 *   the Barnett.
 * - Net pay: inside each clean zone, samples with GR at most 75 API, deep
 *   resistivity at least 10 ohm.m and density porosity at least 8% in the
 *   sands or 5% in the limes, counted only in runs of 2 ft or more, half a
 *   foot each.
 * - Density porosity: (matrix - bulk) / (matrix - fluid), sandstone matrix
 *   2.65 g/cc for the Strawn sands and the Bend Conglomerate, limestone 2.71
 *   for the Caddo, Chappel and Ellenburger, fresh mud filtrate 1.0 g/cc.
 * - No Rw is on the log, so no water saturation: a porous zone that fails
 *   only on resistivity is called wet against the same sands' pay, not by Sw.
 */
import type { Conversation } from "@/lib/ai/conversations";
import type { ChartSpec } from "@/lib/ai/chart-spec";
import type { UIMessage } from "@/lib/ai/sdk";
import { readPart } from "./orion-fixture";
import { LAS_FILE_NAME, LAS_WELL, smith4Las } from "./mobile-b-fixture";

export const GR_TOP_CUT = 85;
const SMOOTH_HALF = 10;
const HOLD_SAMPLES = 60;
export const GR_PAY_CUT = 75;
export const RES_PAY_CUT = 10;
export const PHI_CUT_SAND = 0.08;
export const PHI_CUT_LIME = 0.05;
const MIN_RUN_SAMPLES = 4;
export const MATRIX_SAND = 2.65;
export const MATRIX_LIME = 2.71;
export const FLUID = 1.0;
const STEP_FT = 0.5;
/** Perforations stop this far above a water contact. */
const STANDOFF_FT = 10;

export interface LasBreak {
  depth: number;
  to: "shale" | "clean";
}

export interface PayZone {
  name: string;
  lime: boolean;
  top: number;
  base: number;
  /** Feet passing every cutoff. */
  net: number;
  /** Mean density porosity over the pay samples, as a fraction (0 with no pay). */
  phi: number;
  /** Mean density porosity over the clean rock (GR at or under the pay cut). */
  phiClean: number;
  /** Median deep resistivity over the clean rock, ohm.m. */
  resClean: number;
  /** Deepest pay sample, ft. */
  lastPay: number | null;
  firstPay: number | null;
  /** Where resistivity falls under the cut below the pay and stays under it to the base, at least 10 ft above it, ft. */
  water: number | null;
}

/** Where the smoothed GR crosses the cutoff and holds, shallow to deep. */
export function lasBreaks(): LasBreak[] {
  const [depth, gr] = smith4Las().data;
  const smooth = gr.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let k = Math.max(0, i - SMOOTH_HALF); k <= Math.min(gr.length - 1, i + SMOOTH_HALF); k++) {
      s += gr[k];
      n++;
    }
    return s / n;
  });
  const kind = (v: number): LasBreak["to"] => (v > GR_TOP_CUT ? "shale" : "clean");
  let state = kind(smooth[0]);
  const out: LasBreak[] = [];
  for (let i = 1; i < smooth.length; i++) {
    const k = kind(smooth[i]);
    if (k === state) continue;
    let holds = true;
    for (let j = i; j < Math.min(smooth.length, i + HOLD_SAMPLES); j++) {
      if (kind(smooth[j]) !== k) {
        holds = false;
        break;
      }
    }
    if (holds) {
      out.push({ depth: depth[i], to: k });
      state = k;
    }
  }
  return out;
}

/** The clean zones' names, shallow to deep, and which of them are limestones. */
const CLEAN_NAMES = [
  "Strawn 1800 sand",
  "Strawn 2400 sand",
  "Strawn 3100 sand",
  "Strawn 3450 sand",
  "Caddo",
  "Bend Conglomerate",
  "Chappel",
  "Ellenburger",
];
const LIMES = new Set(["Caddo", "Chappel", "Ellenburger"]);

/** Formation tops for the table: each clean break, and the Barnett under the Bend Conglomerate. */
export function lasTops(): { name: string; depth: number }[] {
  const b = lasBreaks();
  const out: { name: string; depth: number }[] = [];
  let clean = 0;
  for (let i = 0; i < b.length; i++) {
    if (b[i].to === "clean") {
      out.push({ name: CLEAN_NAMES[clean++], depth: b[i].depth });
    } else if (CLEAN_NAMES[clean - 1] === "Bend Conglomerate") {
      out.push({ name: "Barnett Shale", depth: b[i].depth });
    }
  }
  return out;
}

/** Net pay, porosity and resistivity for each clean zone between the breaks. */
export function lasPayZones(): PayZone[] {
  const las = smith4Las();
  const [depth, gr, res, den] = las.data;
  const b = lasBreaks();
  const edges = [las.depth.start, ...b.map((x) => x.depth), las.depth.stop + STEP_FT];
  const zones: PayZone[] = [];
  let clean = 0;
  for (let z = 0; z < edges.length - 1; z++) {
    const top = edges[z];
    const base = edges[z + 1];
    const isClean = z === 0 ? b[0].to === "shale" : b[z - 1].to === "clean";
    if (!isClean) continue;
    const name = CLEAN_NAMES[clean++];
    const lime = LIMES.has(name);
    const matrix = lime ? MATRIX_LIME : MATRIX_SAND;
    const phiCut = lime ? PHI_CUT_LIME : PHI_CUT_SAND;
    const phiOf = (i: number) => (matrix - den[i]) / (matrix - FLUID);
    const idx: number[] = [];
    for (let i = 0; i < depth.length; i++) if (depth[i] >= top && depth[i] < base) idx.push(i);
    const cleanRock = idx.filter((i) => gr[i] <= GR_PAY_CUT);
    const passes = (i: number) => gr[i] <= GR_PAY_CUT && res[i] >= RES_PAY_CUT && phiOf(i) >= phiCut;
    // Pay only in runs of 2 ft or more.
    const pay: number[] = [];
    let run: number[] = [];
    for (const i of [...idx, -1]) {
      if (i >= 0 && passes(i)) run.push(i);
      else {
        if (run.length >= MIN_RUN_SAMPLES) pay.push(...run);
        run = [];
      }
    }
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, i) => a + phiOf(i), 0) / xs.length : 0);
    const sortedRes = cleanRock.map((i) => res[i]).sort((x, y) => x - y);
    const lastPay = pay.length ? depth[pay[pay.length - 1]] : null;
    const below = lastPay == null ? [] : cleanRock.filter((i) => depth[i] > lastPay);
    const firstWet = below.find((i) => res[i] < RES_PAY_CUT);
    const wetLeg = firstWet == null ? [] : below.filter((i) => depth[i] >= depth[firstWet]);
    const water =
      firstWet != null && wetLeg.every((i) => res[i] < RES_PAY_CUT) && wetLeg.length * STEP_FT >= STANDOFF_FT
        ? depth[firstWet]
        : null;
    zones.push({
      name,
      lime,
      top,
      base: Math.min(base, las.depth.stop),
      net: pay.length * STEP_FT,
      phi: mean(pay),
      phiClean: mean(cleanRock),
      resClean: sortedRes.length ? sortedRes[Math.floor(sortedRes.length / 2)] : 0,
      lastPay,
      firstPay: pay.length ? depth[pay[0]] : null,
      water,
    });
  }
  return zones;
}

const ft = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (f: number) => `${(f * 100).toFixed(1)}%`;
const phiFt = (z: PayZone) => Math.round(z.net * z.phi * 10) / 10;
const res1 = (n: number) => (n >= 10 ? Math.round(n).toString() : n.toFixed(1));

/** The zones with pay, shallow to deep. */
export function lasReportZones(): PayZone[] {
  return lasPayZones().filter((z) => z.net > 0);
}

/** The pay zones above the producing Caddo, most porosity-feet first: the recompletion candidates. */
export function behindPipeZones(): PayZone[] {
  const all = lasPayZones();
  const producing = all.find((z) => z.name === "Caddo")!;
  return all.filter((z) => z.net > 0 && z.top < producing.top).sort((a, b) => phiFt(b) - phiFt(a));
}

export function lasChart(): ChartSpec {
  return {
    chartType: "bar",
    title: `${LAS_WELL.name} porosity-feet by zone`,
    xKey: "zone",
    yLabel: "porosity-ft",
    series: [{ key: "phiH", label: "Net pay × porosity", color: "var(--chart-1)" }],
    data: lasReportZones().map((z) => ({ zone: z.name, phiH: phiFt(z) })),
  };
}

export const LAS_QUESTION =
  "Interpret this log for me. Smith 4 produces from the Caddo now. Where are the tops, where's the pay, and is anything behind pipe worth a recompletion?";

export function lasReplies(): [string, string] {
  const las = smith4Las();
  const rows = las.data[0].length;
  const tops = lasTops();
  const all = lasPayZones();
  const payZones = all.filter((z) => z.net > 0);
  const net = payZones.reduce((a, z) => a + z.net, 0);
  const grossClean = all.reduce((a, z) => a + (z.base - z.top), 0);
  // Behind pipe: every pay zone above the one producing now.
  const producing = all.find((z) => z.name === "Caddo")!;
  const behind = behindPipeZones();
  const pick = behind[0];
  const next = behind[1];
  // The porous zones that fail only on resistivity: wet.
  const wet = all.filter((z) => z.net === 0 && z.phiClean >= (z.lime ? PHI_CUT_LIME : PHI_CUT_SAND) && z.resClean < RES_PAY_CUT);
  const wetSand = wet.find((z) => !z.lime);
  const bestPhi = Math.max(...all.map((z) => z.phiClean));
  const wetLime = wet.find((z) => z.lime);
  const tight = all.filter((z) => z.net === 0 && z.resClean >= RES_PAY_CUT);
  const perfTop = pick.firstPay!;
  const perfBase = pick.water != null ? pick.water - STANDOFF_FT : pick.lastPay!;

  const reply1 = `Read the whole log: ${ft(las.depth.start)} to ${ft(las.depth.stop)} ft, ${ft(rows)} rows of GR, RES and DEN.

**Tops**, where GR on a 10 ft average crosses ${GR_TOP_CUT} API and holds for 30 ft:

| Top | Depth, ft |
|---|---|
${tops.map((t) => `| ${t.name} | ${ft(t.depth)} |`).join("\n")}

**Pay** is GR at most ${GR_PAY_CUT} API, RES at least ${RES_PAY_CUT} ohm.m and density porosity at least ${PHI_CUT_SAND * 100}% in the sands or ${PHI_CUT_LIME * 100}% in the limes, in runs of 2 ft or more. Porosity is on a ${MATRIX_SAND.toFixed(2)} g/cc sandstone matrix for the Strawn and the Bend Conglomerate, ${MATRIX_LIME.toFixed(2)} limestone for the Caddo, Chappel and Ellenburger, and ${FLUID.toFixed(1)} g/cc fluid:

| Zone | Interval, ft | Porosity | RES, ohm.m | Net pay |
|---|---|---|---|---|
${all.map((z) => `| ${z.name} | ${ft(z.top)} to ${ft(z.base)} | ${pct(z.phiClean)} | ${res1(z.resClean)} | ${z.net > 0 ? `${ft(z.net)} ft` : "none"} |`).join("\n")}

That is **${ft(net)} ft of pay in ${ft(grossClean)} ft of clean rock**. Porosity and RES are the clean rock's mean and median.`;

  const reply2 = `**The ${pick.name} is the recompletion.** It is behind the casing above the Caddo, with ${ft(pick.net)} ft of pay at ${pct(pick.phi)}, ${phiFt(pick)} porosity-feet, the most on the log.${
    pick.water != null
      ? ` RES drops under ${RES_PAY_CUT} ohm.m at ${ft(pick.water)} ft and stays there to the base, so the bottom ${ft(pick.base - pick.water)} ft is wet. Perforate ${ft(perfTop)} to ${ft(perfBase)} ft and stay ${STANDOFF_FT} ft above that water.`
      : ` Perforate ${ft(perfTop)} to ${ft(perfBase)} ft.`
  }${next ? ` The ${next.name} is the next one up the hole, ${ft(next.net)} ft at ${pct(next.phi)}, ${phiFt(next)} porosity-feet.` : ""}

${wetSand ? `Stay out of the ${wetSand.name}. It has ${wetSand.phiClean === bestPhi ? "the best porosity on the log" : "good porosity"}, ${pct(wetSand.phiClean)}, but reads ${res1(wetSand.resClean)} ohm.m, so it is wet. ` : ""}${tight.length ? `The ${tight.map((z) => z.name).join(" and the ")} ${tight.length > 1 ? "are" : "is"} tight on this cut. ` : ""}${wetLime ? `The ${wetLime.name} reads ${res1(wetLime.resClean)} ohm.m through most of its ${ft(wetLime.base - wetLime.top)} ft, wet, and it is where this area disposes of saltwater, not a target.` : ""}

The Caddo carries ${ft(producing.net)} ft at ${pct(producing.phi)}. When it is done, set a plug over the Caddo perforations, shoot the ${pick.name} and swab it before deciding on a frac. This log carries no Rw, so I have not worked water saturation, and the wet calls are on resistivity against the same sands' pay.`;
  return [reply1, reply2];
}

/** `2026-10-27` 08:40 local, the fixture's operating morning. */
const WHEN = new Date("2026-10-27T08:40:00").getTime();

export function smith4LogThread(): Conversation {
  const [reply1, reply2] = lasReplies();
  const user: UIMessage = {
    id: "conv-smith4-log-u1",
    role: "user",
    metadata: { createdAt: new Date(WHEN).toISOString() },
    // A file attached from the knowledge base rides as this trailer, which the
    // chat renders as a chip (orion-chat.tsx `splitAttachments`).
    parts: [{ type: "text", text: `${LAS_QUESTION}\n\n[Attached from knowledge base: ${LAS_FILE_NAME}]`, state: "done" }],
  };
  return {
    id: "conv-smith4-log",
    title: `${LAS_WELL.name} log, tops and pay`,
    createdAt: WHEN,
    updatedAt: WHEN + 38_000,
    messages: [
      user,
      {
        id: "conv-smith4-log-a1",
        role: "assistant",
        metadata: { createdAt: new Date(WHEN + 38_000).toISOString() },
        parts: [
          { type: "step-start" },
          readPart("browse_files", 0),
          readPart("read_las_full", 1),
          { type: "text", text: reply1, state: "done" },
          { type: "tool-render_chart", toolCallId: "toolu_chart_smith4_log", state: "output-available", input: {}, output: lasChart() },
          { type: "text", text: reply2, state: "done" },
        ],
      },
    ],
  };
}
