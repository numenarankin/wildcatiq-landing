/**
 * Data for the phone's LAS, comments and Orion screens that the shared
 * operator does not carry: a synthetic open-hole log on Smith 4 and the
 * thread on its well page. Names, wells and dates come from operator.ts.
 *
 * The log is simulated from the formulas below, never read from a real file.
 * It runs from below surface casing at 300 ft to 5,000 ft at half-foot
 * samples, the section a Graham-area vertical is logged over: Canyon shale
 * with thin limes, the Strawn shales and their sands, the Caddo lime of the
 * Bend group, the Bend Conglomerate, the Barnett Shale, the Chappel lime and
 * the Ellenburger. Three curves: GR (API), RES (ohm.m, deep resistivity) and
 * DEN (g/cc bulk density).
 *
 * Each bed sets a shale fraction, a porosity, a true resistivity and a
 * matrix density (2.65 sandstone, 2.71 limestone). Beds blend over the 3 ft
 * above each top, then per sample:
 *
 *   GR  = 24 + 108 vsh + 7 n1
 *   RES = 10^((1 - vsh) log10(Rt) + vsh log10(2.8) + 0.06 n2)
 *   DEN = (1 - vsh) (rhoMa (1 - phi) + 1.0 phi) + 2.58 vsh + 0.012 n3
 *
 * where n1, n2 and n3 are deterministic noise in [-1, 1], so the trace has a
 * log's texture and the same shape on every render.
 */
import { FIXTURE_TODAY, OPERATOR, WELLS } from "./operator";
import { FIELD_NAME, WELL_API, apiDashed } from "./rrc-ids";

export const LAS_WELL = WELLS.find((w) => w.id === "w-s4")!;
export const LAS_FILE_NAME = "Smith_4_GR_RES_DEN.las";

export const LAS_START = 300;
export const LAS_STOP = 5000;
const STEP = 0.5;

function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

const SS = 2.65;
const LS = 2.71;

/** A bed from its top (ft) down to the next: shale fraction, porosity, true resistivity (ohm.m), matrix density (g/cc). */
type Bed = [top: number, vsh: number, phi: number, rt: number, rhoMa: number];

/** The section, shallow to deep. */
const BEDS: Bed[] = [
  [300, 0.85, 0.08, 3, SS], // Canyon shale
  [620, 0.15, 0.03, 60, LS], // thin Canyon lime
  [640, 0.85, 0.08, 3, SS],
  [980, 0.15, 0.03, 60, LS], // thin Canyon lime
  [1000, 0.85, 0.08, 3, SS],
  [1240, 0.15, 0.03, 60, LS], // thin Canyon lime
  [1262, 0.82, 0.08, 3, SS], // Strawn shale
  [1778, 0.1, 0.19, 2.4, SS], // Strawn 1800 sand: porous and wet
  [1842, 0.82, 0.08, 3, SS],
  [2384, 0.15, 0.14, 22, SS], // Strawn 2400 sand
  [2414, 0.8, 0.08, 3, SS], // shale break
  [2419, 0.15, 0.14, 22, SS],
  [2436, 0.15, 0.05, 60, SS], // calcite-cemented tight streak
  [2441, 0.15, 0.14, 22, SS],
  [2452, 0.82, 0.08, 3, SS],
  [3076, 0.1, 0.17, 28, SS], // Strawn 3100 sand
  [3104, 0.1, 0.04, 80, SS], // tight streak
  [3110, 0.1, 0.17, 28, SS],
  [3128, 0.8, 0.08, 3, SS], // shale break
  [3133, 0.1, 0.17, 28, SS],
  [3152, 0.1, 0.17, 3, SS], // the same sand below its oil-water contact
  [3188, 0.82, 0.08, 3, SS],
  [3438, 0.3, 0.1, 20, SS], // Strawn 3450 sand, shaly
  [3480, 0.85, 0.08, 3, SS], // Bend shale
  [3922, 0.08, 0.048, 90, LS], // Caddo lime
  [3960, 0.08, 0.085, 70, LS], // a better Caddo streak
  [3975, 0.08, 0.048, 90, LS],
  [4034, 0.85, 0.08, 3, SS], // Smithwick shale
  [4180, 0.25, 0.075, 18, SS], // Bend Conglomerate
  [4276, 0.98, 0.06, 20, SS], // Barnett Shale
  [4520, 0.08, 0.025, 300, LS], // Chappel lime
  [4598, 0.7, 0.06, 6, SS], // shaly break above the Ellenburger
  [4640, 0.05, 0.03, 150, LS], // Ellenburger, tight
  [4760, 0.05, 0.075, 1.6, LS], // Ellenburger, porous and wet
];
const BLEND_FT = 3;

/** Bed properties at a depth, blended linearly over the 3 ft above each top. */
function bedAt(d: number): { vsh: number; phi: number; logRt: number; rhoMa: number } {
  let i = 0;
  while (i + 1 < BEDS.length && d >= BEDS[i + 1][0]) i++;
  const props = (b: Bed) => ({ vsh: b[1], phi: b[2], logRt: Math.log10(b[3]), rhoMa: b[4] });
  const here = props(BEDS[i]);
  const next = BEDS[i + 1];
  if (!next || d < next[0] - BLEND_FT) return here;
  const t = (d - (next[0] - BLEND_FT)) / BLEND_FT;
  const there = props(next);
  return {
    vsh: here.vsh + (there.vsh - here.vsh) * t,
    phi: here.phi + (there.phi - here.phi) * t,
    logRt: here.logRt + (there.logRt - here.logRt) * t,
    rhoMa: here.rhoMa + (there.rhoMa - here.rhoMa) * t,
  };
}

export interface SyntheticLas {
  well: { WELL: string; FLD: string; API: string };
  depth: { mnemonic: string; unit: string; start: number; stop: number };
  curves: { mnemonic: string; unit: string }[];
  /** Column-major, depth first, as `parseLas` returns it. */
  data: number[][];
}

function build(): SyntheticLas {
  const depth: number[] = [];
  const gr: number[] = [];
  const res: number[] = [];
  const den: number[] = [];
  const n = Math.round((LAS_STOP - LAS_START) / STEP);
  for (let i = 0; i <= n; i++) {
    const d = LAS_START + i * STEP;
    const b = bedAt(d);
    const n1 = noise(i * 0.37) * 0.6 + noise(Math.floor(i / 7)) * 0.4;
    const n2 = noise(i * 0.53 + 11) * 0.6 + noise(Math.floor(i / 9) + 5) * 0.4;
    const n3 = noise(i * 0.71 + 3);
    depth.push(d);
    gr.push(24 + 108 * b.vsh + 7 * n1);
    res.push(Math.pow(10, (1 - b.vsh) * b.logRt + b.vsh * Math.log10(2.8) + 0.06 * n2));
    den.push((1 - b.vsh) * (b.rhoMa * (1 - b.phi) + 1.0 * b.phi) + 2.58 * b.vsh + 0.012 * n3);
  }
  return {
    well: { WELL: LAS_WELL.name, FLD: FIELD_NAME, API: apiDashed(WELL_API[LAS_WELL.id]) },
    depth: { mnemonic: "DEPT", unit: "ft", start: LAS_START, stop: LAS_STOP },
    curves: [
      { mnemonic: "DEPT", unit: "ft" },
      { mnemonic: "GR", unit: "API" },
      { mnemonic: "RES", unit: "ohm.m" },
      { mnemonic: "DEN", unit: "g/cc" },
    ],
    data: [depth, gr, res, den],
  };
}

let cached: SyntheticLas | null = null;
export function smith4Las(): SyntheticLas {
  return (cached ??= build());
}

/** The moment every phone screen is captured at: 7:41 on the fixture day. */
export const SCREEN_NOW = Date.parse(`${FIXTURE_TODAY}T07:41:00`);
const at = (date: string, hhmm: string) => Date.parse(`${date}T${hhmm}:00`);

export interface ThreadComment {
  id: string;
  author: string;
  createdAt: number;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  replies: ThreadComment[];
}

/**
 * Smith 4's comment thread as the owner sees it: roots newest first, replies
 * oldest first (`threadComments`).
 */
export const SMITH4_COMMENTS: ThreadComment[] = [
  {
    id: "c2",
    author: OPERATOR.pumper,
    createdAt: at(FIXTURE_TODAY, "07:12"),
    body: "Smith 4 pumping off again. Cut time 2 hrs on the timer.",
    likeCount: 1,
    likedByMe: true,
    replies: [
      {
        id: "c3",
        author: OPERATOR.owner,
        createdAt: at(FIXTURE_TODAY, "07:30"),
        body: "Good. Shoot a fluid level Thursday and we will look at the SPM.",
        likeCount: 0,
        likedByMe: false,
        replies: [],
      },
    ],
  },
  {
    id: "c1",
    author: OPERATOR.owner,
    createdAt: at("2026-10-26", "15:20"),
    body: "Polish rod was dry on the last round. Grease the stuffing box.",
    likeCount: 0,
    likedByMe: false,
    replies: [],
  },
];

/** Orion's turn times on the fixture morning. */
export const ORION_TIMES = { user: at(FIXTURE_TODAY, "07:38"), assistant: at(FIXTURE_TODAY, "07:38") };
