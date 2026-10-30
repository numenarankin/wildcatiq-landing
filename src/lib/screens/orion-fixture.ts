/**
 * The Orion workspace's fixture: Sky Resources' chat history and the
 * exchanges the Orion screens play, in the AI SDK's UIMessage shape the app's
 * components read.
 *
 * Every number Orion quotes is computed here from the shared operator: rates
 * and volumes from `dashboardFixture()`, gauges, hauls and the purchaser's statement
 * from `documents-tanks.ts` / `documents-fixture.ts`. Only the public-record
 * facts (Tonk Creek's permit and its offset wells, all simulated) are Orion's
 * own, and the permit is the Recon fixture's: its depth, approval date and
 * distance from A-3 are read off `reconPermit` and the map coordinates.
 */
import type { Conversation } from "@/lib/ai/conversations";
import type { UIMessage } from "@/lib/ai/sdk";
import type { ChartSpec } from "@/lib/ai/chart-spec";
import { dashboardFixture } from "./dashboard-fixture";
import { PRUITT_NAMES } from "./orion-facilities-fixture";
import { EVENTS, LEASES, OPERATOR, PURCHASERS, SWD, TANKS, WELLS, leaseOf } from "./operator";
import { A3_LNG_LAT, PERMIT_LNG_LAT, PERMIT_OPERATOR, milesBetween, reconPermit } from "./recon-fixture";
import { NEIGHBOUR, OFFSETS, OFFSET_FIRST_YEAR } from "./recon-tonk-fixture";
import { SEPTEMBER, SMITH_OCT_HAUL, feetInches, leaseTank, smithBbl, smithWeekGauges, wellMonthOil } from "./documents-tanks";
import {
  BOYD,
  GAUGE_SHEET_FILE,
  LEASE_PRICE,
  RUN_GRAVITY,
  midMonthLabel,
  midMonthLease,
  midMonthRuns,
  septemberLeases,
  septemberLine,
  septemberTotals,
} from "./documents-fixture";

/** Same operating day as the dashboard fixture. */
export const ORION_TODAY = "2026-10-27";

/** Ids on approval cards, resolved to names the way the app's name lookup does. */
export const FIXTURE_NAMES: Record<string, string> = Object.fromEntries([
  ...WELLS.map((w) => [w.id, w.name]),
  ...TANKS.map((t) => [t.id, t.name]),
  ...LEASES.map((l) => [l.id, l.name]),
  // The lease the office manager sets up on Facilities, named once it exists.
  ...Object.entries(PRUITT_NAMES),
]);

const numberWord = (n: number) => ["no", "one", "two", "three", "four", "five", "six"][n] ?? String(n);
const fmt1 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt0 = (n: number) => Math.round(n).toLocaleString("en-US");
const ftin = (inches: number) => {
  const { ft, in: i } = feetInches(inches);
  return `${ft} ft ${i} in`;
};
const monthName = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

/** `ORION_TODAY` at a local wall-clock time, as epoch ms. */
function at(hhmm: string, daysAgo = 0): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${ORION_TODAY}T00:00:00`);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function text(id: string, role: "user" | "assistant", body: string, when: number): UIMessage {
  return {
    id,
    role,
    metadata: { createdAt: new Date(when).toISOString() },
    parts: [{ type: "text", text: body, state: "done" }],
  };
}

/** A completed read, as the SDK records it after the tool returns. */
export function readPart(name: string, i: number): UIMessage["parts"][number] {
  return {
    type: `tool-${name}`,
    toolCallId: `toolu_read_${name}_${i}`,
    state: "output-available",
    input: {},
    output: { ok: true },
  };
}

function chartToolPart(id: string, spec: ChartSpec): UIMessage["parts"][number] {
  return { type: "tool-render_chart", toolCallId: id, state: "output-available", input: {}, output: spec };
}

const fx = () => dashboardFixture();
const series = (wellId: string) => fx().byWellMonthly.find((s) => s.wellId === wellId)!;

/* ---- Hero: Tonk Creek's permit next to Johnson A ---------------------- */

const A3 = WELLS.find((w) => w.id === "w-ja3")!;

/** Johnson A 3's first twelve months on production, bbl/d, off the dashboard's monthly series. */
function a3FirstYear(): { month: string; rate: number }[] {
  const m = series(A3.id).monthly;
  const first = m.findIndex((x) => x.oilBbl > 0);
  return m.slice(first, first + 12).map((x) => ({ month: x.month, rate: x.oilBblPerDay ?? 0 }));
}

/*
 * Tonk Creek's offsets (their first-year curve, the three wells, and the
 * size of the P-5) live in `recon-tonk-fixture.ts`, the one source the Recon
 * dossiers read too.
 */

const permitMiles = () => Math.round(milesBetween(A3_LNG_LAT, PERMIT_LNG_LAT) * 10) / 10;
const permitDepth = () => (typeof reconPermit.depth === "number" ? reconPermit.depth : 0);
/** The approval date: `days` before the fixture day, as the permit panel counts it. */
const permitApproved = () => {
  const d = new Date(`${ORION_TODAY}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (typeof reconPermit.days === "number" ? reconPermit.days : 0));
  return d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};
const PERMIT_WELL = "Harlan Ranch 3";

export const PERMIT_QUESTION =
  "A new permit just showed up next to Johnson A. Who is it, what are their offset wells doing, and what does it mean for our A-3?";

/** The reads Orion makes, in order, each shown by the thinking line as it runs. */
export const PERMIT_TOOLS = [
  "rrc_permits",
  "rrc_operator",
  "rrc_wells_near",
  "rrc_completion",
  "get_production",
  "get_decline",
] as const;

function permitNumbers() {
  const a3 = a3FirstYear();
  const m = series(A3.id).monthly;
  const onIdx = m.findIndex((x) => x.oilBbl > 0);
  const ageMonths = m.length - 1 - onIdx;
  const a3Decline = 1 - a3[11].rate / a3[0].rate;
  const offDecline = 1 - OFFSET_FIRST_YEAR[11] / OFFSET_FIRST_YEAR[0];
  const multiple = OFFSET_FIRST_YEAR[0] / a3[0].rate;
  const month12Ahead = a3[11].rate > OFFSET_FIRST_YEAR[11];
  const now = fx().wellRows.find((r) => r.wellId === A3.id)!.oilBbl;
  return { a3, ageMonths, a3Decline, offDecline, multiple, month12Ahead, now };
}

export const PERMIT_REPLY_1 = (() => {
  return `It is **${PERMIT_OPERATOR.short} LLC**, permit approved ${permitApproved()} for **${PERMIT_WELL}**, a ${fmt0(permitDepth())} ft vertical in the Young County Regular field, surface location ${permitMiles()} mi west of your A-3. They are a private operator out of Graham, ${NEIGHBOUR.wells} wells on the P-5, and this is their third permit in ${OPERATOR.county} County this year.

Their three nearest producers (the **${OFFSETS[0].name}**, **${OFFSETS[1].name}** and **${OFFSETS[2].name}**, ${OFFSETS[0].where.split(" ")[0]} to ${OFFSETS[2].where.split(" ")[0]} mi out) are Caddo wells that came on in 2024 and 2025. Here is their first year against A-3's:`;
})();

export const PERMIT_CHART: ChartSpec = (() => {
  const a3 = a3FirstYear();
  return {
    chartType: "line",
    title: "First 12 months on production, oil",
    xKey: "month",
    yLabel: "bbl/d",
    series: [
      { key: "offset", label: "Tonk Creek Caddo wells (avg of 3)", color: "var(--chart-2)" },
      { key: "a3", label: "Johnson A 3", color: "var(--chart-5)" },
    ],
    data: OFFSET_FIRST_YEAR.map((offset, i) => ({ month: `M${i + 1}`, offset, a3: Math.round(a3[i].rate * 10) / 10 })),
  };
})();

export const PERMIT_REPLY_2 = (() => {
  const n = permitNumbers();
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return `Their wells came on at about **${n.multiple.toFixed(1)} times** A-3's first-month rate and lost ${pct(n.offDecline)} in year one. A-3 lost ${pct(n.a3Decline)} over the same stretch${n.month12Ahead ? " and was out-making them by month 12" : ""}. It is making ${fmt1(n.now)} bbl/d today, ${n.ageMonths} months on.

What it means for A-3:

- **Same zone.** ${PERMIT_WELL} is permitted to ${fmt0(permitDepth())} ft, through the Caddo that A-3 produces. A first-year drop like theirs usually means a small Caddo buildup, and A-3 may sit on the same one.
- **Spacing.** At ${permitMiles()} mi it clears the statewide rule of 467 ft from the lease line and 1,200 ft between wells, so there is nothing to protest.
- **Drainage.** If it is one buildup, their well will pull from A-3's side once it is on. You will only see that against a baseline taken before they spud.

I would shoot a fluid level and run a 24-hour test on A-3 now. Want me to put that on ${OPERATOR.pumper.split(" ")[0]}'s list?`;
})();

/** The follow-up Orion proposes, pending Jim's approval or already saved. */
export function permitTaskPart(state: "pending" | "saved"): UIMessage["parts"][number] {
  return {
    type: "tool-create_task",
    toolCallId: "toolu_01J9mQ4tR8vX2kP7nL5sWdC3",
    state: state === "pending" ? "approval-requested" : "output-available",
    input: {
      summary: `Create a task for ${OPERATOR.pumper.split(" ")[0]}: fluid level and 24-hour test on Johnson A 3 before ${PERMIT_WELL} spuds`,
      title: "Fluid level and 24-hour test on Johnson A 3",
      dueDate: "2026-10-30",
      assignee: OPERATOR.pumper,
      notes: `Baseline before ${PERMIT_OPERATOR.short}'s ${PERMIT_WELL} spuds, ${permitMiles()} mi west in the same Caddo. Shoot the fluid level first, then test oil, water and gas for 24 hours.`,
    },
    output: state === "saved" ? { ok: true } : undefined,
    approval: { id: "appr_01J9mQ4tR8vX2kP7nL5sWdC3", ...(state === "saved" ? { approved: true } : {}) },
  };
}

export function chartPart(): UIMessage["parts"][number] {
  return chartToolPart("toolu_chart_1", PERMIT_CHART);
}

/** The exchange at rest, for the history list and anything reading the thread whole. */
const permitThread = (): UIMessage[] => [
  text("msg-permit-u1", "user", PERMIT_QUESTION, at("07:12")),
  {
    id: "msg-permit-a1",
    role: "assistant",
    metadata: { createdAt: new Date(at("07:12") + 24_000).toISOString() },
    parts: [
      { type: "step-start" },
      ...PERMIT_TOOLS.map((t, i) => readPart(t, i)),
      { type: "text", text: PERMIT_REPLY_1, state: "done" },
      chartPart(),
      { type: "text", text: PERMIT_REPLY_2, state: "done" },
      permitTaskPart("pending"),
    ],
  },
];

/* ---- Smith T201, the Oct 26 gauge ------------------------------------- */

const SMITH_T201 = leaseTank("l-smith");

export function smithGaugeNumbers() {
  const week = smithWeekGauges();
  const today = week[week.length - 1];
  const prev = week[week.length - 2];
  return {
    tank: SMITH_T201,
    today,
    prev,
    bbl: smithBbl(today.gaugeIn),
    prevBbl: smithBbl(prev.gaugeIn),
    made: Math.round((smithBbl(today.gaugeIn) - smithBbl(prev.gaugeIn)) * 10) / 10,
  };
}

/** Feet and inches as a pumper says them: 47.25 -> "3 foot 11 and a quarter". */
function spokenGauge(inches: number): string {
  const { ft, in: i } = feetInches(inches);
  const whole = Math.floor(i);
  const part = ["", " and a quarter", " and a half", " and three quarters"][Math.round((i - whole) * 4)];
  return `${ft} foot ${whole}${part}`;
}

export const SMITH_GAUGE_QUESTION = `Smith T201 gauged ${spokenGauge(EVENTS.smithGauge.feet * 12 + EVENTS.smithGauge.inches)} this morning. Record it.`;

/** The single gauge reading, as `record_tank_reading` takes it (a batch of one). */
export function smithReadingPart(state: "pending" | "saved"): UIMessage["parts"][number] {
  const n = smithGaugeNumbers();
  return {
    type: "tool-record_tank_reading",
    toolCallId: "toolu_01K2smithT201oct26",
    state: state === "pending" ? "approval-requested" : "output-available",
    input: {
      summary: `Record Smith T201 at ${ftin(n.today.gaugeIn)} (${fmt1(n.bbl)} bbl) on Oct 26, 07:00`,
      rows: [{ tankId: n.tank.id, date: n.today.date, time: n.today.time, gauge: n.today.gaugeIn }],
    },
    output: state === "saved" ? { ok: true, written: 1 } : undefined,
    approval: { id: "appr_smith_t201_oct26", ...(state === "saved" ? { approved: true } : {}) },
  };
}

/** The whole week off the gauge sheet as one card: one call, seven rows, one decision. */
export function smithWeekPart(): UIMessage["parts"][number] {
  const week = smithWeekGauges();
  return {
    type: "tool-record_tank_reading",
    toolCallId: "toolu_01K2smithT201week",
    state: "approval-requested",
    input: {
      summary: `Record 7 gauges on Smith T201, Oct 20 to Oct 26, off ${OPERATOR.pumper}'s sheet`,
      rows: week.map((g) => ({ tankId: SMITH_T201.id, date: g.date, time: g.time, gauge: g.gaugeIn })),
    },
    approval: { id: "appr_smith_t201_week" },
  };
}

function smithGaugeThread(): Conversation {
  const n = smithGaugeNumbers();
  const when = at("07:04", 1);
  const answer = `Recorded Smith T201 at ${ftin(n.today.gaugeIn)} (${fmt1(n.bbl)} bbl), ${fmt1(n.made)} bbl above Oct 25's ${ftin(n.prev.gaugeIn)}. That splits across Smith 1 to 4 on the battery's current allocation.`;
  return {
    id: "conv-smith-gauge",
    title: "Smith T201 gauge, Oct 26",
    createdAt: when,
    updatedAt: when + 40_000,
    messages: [
      text("conv-smith-gauge-u1", "user", SMITH_GAUGE_QUESTION, when),
      {
        id: "conv-smith-gauge-a1",
        role: "assistant",
        metadata: { createdAt: new Date(when + 40_000).toISOString() },
        parts: [{ type: "step-start" }, readPart("get_tank", 0), smithReadingPart("saved"), { type: "text", text: answer, state: "done" }],
      },
    ],
  };
}

/* ---- Section threads --------------------------------------------------- */

export const SMITH_SEPTEMBER_QUESTION = "Which Smith well made the most oil in September?";

export function smithSeptemberTable() {
  return WELLS.filter((w) => w.lease === "l-smith").map((w) => {
    const bbl = wellMonthOil(w.id, SEPTEMBER);
    return { name: w.name, bbl, perDay: bbl / 30 };
  });
}

function smithSeptemberAnswer(): string {
  const rows = smithSeptemberTable();
  const top = [...rows].sort((a, b) => b.bbl - a.bbl)[0];
  const total = rows.reduce((s, r) => s + r.bbl, 0);
  const table = [
    "| Well | Oil (bbl) | bbl/d | Share |",
    "|---|---:|---:|---:|",
    ...rows.map((r) => `| ${r.name} | ${fmt1(r.bbl)} | ${fmt1(r.perDay)} | ${Math.round((r.bbl / total) * 100)}% |`),
    `| **Smith lease** | **${fmt1(total)}** | **${fmt1(total / 30)}** | |`,
  ].join("\n");
  return `**${top.name}** led the lease with ${fmt1(top.bbl)} bbl in September, ${Math.round((top.bbl / total) * 100)}% of Smith's oil.

${table}

Those are allocated volumes off Smith T201's gauges and runs, the same numbers the Dashboard and the Smith lease page show.`;
}

export function smithSeptemberThread(): Conversation {
  const when = at("08:31");
  return {
    id: "conv-smith-september",
    title: "Smith September oil",
    createdAt: when,
    updatedAt: when + 18_000,
    messages: [
      text("conv-smith-september-u1", "user", SMITH_SEPTEMBER_QUESTION, when),
      {
        id: "conv-smith-september-a1",
        role: "assistant",
        metadata: { createdAt: new Date(when + 18_000).toISOString() },
        parts: [
          { type: "step-start" },
          readPart("list_wells", 0),
          readPart("get_production", 1),
          { type: "text", text: smithSeptemberAnswer(), state: "done" },
        ],
      },
    ],
  };
}

export const OFFSETS_QUESTION = "What are the offsets around Johnson A 3 doing?";

export function offsetsThread(): Conversation {
  const when = at("07:40");
  const n = permitNumbers();
  // The three average to the chart's offset curve.
  const cum = OFFSET_FIRST_YEAR.reduce((a, b) => a + b, 0) * 30.4;
  const answer = `Three producing Caddo wells sit within ${OFFSETS[2].where.split(" ")[0]} mi of Johnson A 3, all ${PERMIT_OPERATOR.short}'s, and one new permit is approved inside a mile.

| Well | Operator | Distance | Online | First 12 mo oil (bbl) |
|---|---|---:|---|---:|
${OFFSETS.map((o) => `| ${o.name} | ${PERMIT_OPERATOR.short} | ${o.where} | ${o.online} | ${fmt0(cum * o.share)} |`).join("\n")}
| ${PERMIT_WELL} | ${PERMIT_OPERATOR.short} | ${permitMiles()} mi W | Permit ${permitApproved()} | |

A-3 made ${fmt0(n.a3.reduce((s, r) => s + r.rate * 30.4, 0))} bbl over its own first 12 months. I put the four on the map.`;
  return {
    id: "conv-a3-offsets",
    title: "Johnson A 3 offsets",
    createdAt: when,
    updatedAt: when + 21_000,
    messages: [
      text("conv-a3-offsets-u1", "user", OFFSETS_QUESTION, when),
      {
        id: "conv-a3-offsets-a1",
        role: "assistant",
        metadata: { createdAt: new Date(when + 21_000).toISOString() },
        parts: [
          { type: "step-start" },
          readPart("rrc_wells_near", 0),
          readPart("rrc_series", 1),
          readPart("rrc_permits", 2),
          readPart("get_production", 3),
          { type: "text", text: answer, state: "done" },
          { type: "tool-scout_set_view", toolCallId: "toolu_scout_view", state: "output-available", input: {}, output: { ok: true } },
        ],
      },
    ],
  };
}

const RC4 = WELLS.find((w) => w.id === EVENTS.rc4Downtime.well)!;

/** Roy Corbett 4's last 24 months of oil, bbl/d, with a 12-month exponential fit drawn forward. */
export function corbettDecline() {
  const m = series(RC4.id).monthly.filter((x) => x.month <= SEPTEMBER).slice(-24);
  const rates = m.map((x) => x.oilBblPerDay ?? 0);
  // Least-squares fit of ln(rate) on month index.
  const xs = rates.map((_, i) => i);
  const ys = rates.map((r) => Math.log(r));
  const xm = xs.reduce((a, b) => a + b, 0) / xs.length;
  const ym = ys.reduce((a, b) => a + b, 0) / ys.length;
  const slope = xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0) / xs.reduce((s, x) => s + (x - xm) ** 2, 0);
  const b = ym - slope * xm;
  const fit = (i: number) => Math.exp(b + slope * i);
  const annual = 1 - Math.exp(slope * 12);
  const data: Record<string, string | number>[] = m.map((x, i) => ({ month: monthName(x.month), actual: Math.round(rates[i] * 10) / 10, fit: Math.round(fit(i) * 10) / 10 }));
  const lastIdx = m.length - 1;
  const [y, mo] = m[lastIdx].month.split("-").map(Number);
  for (let k = 1; k <= 12; k++) {
    const d = new Date(Date.UTC(y, mo - 1 + k, 1));
    const label = monthName(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    data.push({ month: label, fit: Math.round(fit(lastIdx + k) * 10) / 10 });
  }
  const forward = Array.from({ length: 12 }, (_, k) => fit(lastIdx + 1 + k) * 30.4).reduce((a, c) => a + c, 0);
  const spec: ChartSpec = {
    chartType: "line",
    title: `${RC4.name} oil, with 12-month decline`,
    xKey: "month",
    yLabel: "bbl/d",
    series: [
      { key: "actual", label: "Actual", color: "var(--chart-5)" },
      { key: "fit", label: "Decline fit", color: "var(--chart-2)" },
    ],
    data,
  };
  return { spec, annual, forward, now: rates[lastIdx] };
}

export const CORBETT_DECLINE_QUESTION = `How fast is ${RC4.name} declining, and what does it make over the next year?`;

export function corbettDeclineThread(): Conversation {
  const when = at("09:15");
  const d = corbettDecline();
  const reply1 = `${RC4.name} is on a **${Math.round(d.annual * 100)}% a year** exponential decline over the last 24 months, and made ${fmt1(d.now)} bbl/d in September.`;
  const reply2 = `Drawn forward, that is about **${fmt0(d.forward)} bbl** over the next 12 months, worth $${fmt0(d.forward * LEASE_PRICE["l-corbett"] * leaseOf(RC4).nri)} to your ${Math.round(leaseOf(RC4).nri * 10000) / 100}% NRI at $${LEASE_PRICE["l-corbett"].toFixed(2)}. The Oct ${EVENTS.rc4Downtime.from.slice(8)} to ${EVENTS.rc4Downtime.to.slice(8)} rod part is left out of the fit, since a shut-in is not decline.`;
  return {
    id: "conv-corbett-decline",
    title: `${RC4.name} decline`,
    createdAt: when,
    updatedAt: when + 26_000,
    messages: [
      text("conv-corbett-decline-u1", "user", CORBETT_DECLINE_QUESTION, when),
      {
        id: "conv-corbett-decline-a1",
        role: "assistant",
        metadata: { createdAt: new Date(when + 26_000).toISOString() },
        parts: [
          { type: "step-start" },
          readPart("get_production", 0),
          readPart("get_downtime", 1),
          readPart("get_decline", 2),
          { type: "text", text: reply1, state: "done" },
          chartToolPart("toolu_chart_rc4", d.spec),
          { type: "text", text: reply2, state: "done" },
        ],
      },
    ],
  };
}

export const T201_FEED_QUESTION = "What is feeding Smith T201?";

export function t201FeedThread(): Conversation {
  const when = at("10:02");
  const rows = fx().wellRows.filter((r) => r.leaseId === "l-smith");
  const total = rows.reduce((s, r) => s + r.oilBbl, 0);
  const water = rows.reduce((s, r) => s + (fx().dailyByWell.find((d) => d.wellId === r.wellId)!.daily.at(-1)!.water ?? 0), 0);
  const answer = `Four wells, through the Smith battery:

${rows.map((r) => `- **${r.name}**, ${fmt1(r.oilBbl)} bbl/d`).join("\n")}

That is ${fmt1(total)} bbl/d of oil into T201 on the last gauged day. The battery's water, about ${fmt0(water)} bbl/d, goes to Smith W1 and on to ${SWD.name}.`;
  return {
    id: "conv-t201-feed",
    title: "What feeds Smith T201",
    createdAt: when,
    updatedAt: when + 9_000,
    messages: [
      text("conv-t201-feed-u1", "user", T201_FEED_QUESTION, when),
      {
        id: "conv-t201-feed-a1",
        role: "assistant",
        metadata: { createdAt: new Date(when + 9_000).toISOString() },
        parts: [{ type: "step-start" }, readPart("get_facility_flow", 0), { type: "text", text: answer, state: "done" }],
      },
    ],
  };
}

export const PHOTO_QUESTION = "Here's Luis's sheet for last week. What did Smith make?";

export function gaugePhotoThread(): Conversation {
  const when = at("12:48");
  const week = smithWeekGauges();
  const bpi = SMITH_T201.bblPerInch;
  const haul = SMITH_OCT_HAUL.volume;
  const made = (week[week.length - 1].gaugeIn - week[0].gaugeIn) * bpi + haul;
  const answer = `Smith T201 went from ${ftin(week[0].gaugeIn)} on Oct 20 to ${ftin(week[week.length - 1].gaugeIn)} on Oct 26, with one load of ${fmt1(haul)} bbl on Oct 23. That is **${fmt1(made)} bbl** made over six days, ${fmt1(made / 6)} bbl/d.

Want me to record the seven gauges?`;
  return {
    id: "conv-gauge-photo",
    title: "Smith gauge sheet, Oct 20 to 26",
    createdAt: when,
    updatedAt: when + 31_000,
    messages: [
      {
        id: "conv-gauge-photo-u1",
        role: "user",
        metadata: { createdAt: new Date(when).toISOString() },
        parts: [
          { type: "file", mediaType: "image/jpeg", filename: GAUGE_SHEET_FILE, url: "data:image/jpeg;base64," },
          { type: "text", text: PHOTO_QUESTION, state: "done" },
        ],
      },
      {
        id: "conv-gauge-photo-a1",
        role: "assistant",
        metadata: { createdAt: new Date(when + 31_000).toISOString() },
        parts: [{ type: "step-start" }, readPart("get_tank", 0), { type: "text", text: answer, state: "done" }, smithWeekPart()],
      },
    ],
  };
}

function corbettDowntimeThread(): Conversation {
  const dt = EVENTS.rc4Downtime;
  const days = Math.round((Date.parse(dt.to) - Date.parse(dt.from)) / 86_400_000) + 1;
  const daily = fx().dailyByWell.find((d) => d.wellId === dt.well)!.daily;
  const before = daily.filter((d) => d.date < dt.from).slice(-7);
  const rate = before.reduce((s, d) => s + d.oilBbl, 0) / before.length;
  const when = at("16:05", 1);
  return thread(
    "conv-corbett-downtime",
    `${RC4.name} downtime`,
    `How long was ${RC4.name} down this month?`,
    `${RC4.name} was down ${days} days, Oct ${dt.from.slice(8)} through Oct ${dt.to.slice(8)}, logged as a rod part. The pump was pulled and rerun, and it came back on Oct ${String(Number(dt.to.slice(8)) + 1)}. Against its ${fmt1(rate)} bbl/d before the part, that is about ${fmt0(rate * days)} bbl deferred.`,
    when
  );
}

function johnsonTicketsThread(): Conversation {
  const { runs, volume, price } = septemberLine("l-johnson");
  return thread(
    "conv-johnson-tickets",
    "Johnson A September run tickets",
    "Pull the September run tickets for Johnson A.",
    `${PURCHASERS.oil} hauled ${runs.length} loads off Johnson A T101 in September: ${fmt1(volume)} net bbl at ${RUN_GRAVITY} API, settled at $${price.toFixed(2)} per bbl. The largest was ticket ${[...runs].sort((a, b) => b.volume - a.volume)[0].ticketNo} at ${fmt1(Math.max(...runs.map((r) => r.volume)))} bbl.`,
    at("11:20", 2)
  );
}

function statementThread(): Conversation {
  const t = septemberTotals();
  const dup = midMonthRuns();
  return thread(
    "conv-september-statement",
    `${PURCHASERS.oil} September statement`,
    `Reconcile the ${PURCHASERS.oil} September statement against our tickets.`,
    `The statement and our tickets agree on ${t.loads} loads and ${fmt1(t.bbl)} net bbl across ${numberWord(septemberLeases().length)} leases. One line needs you: ${FIXTURE_NAMES[midMonthLease()]} repeats ticket ${dup.map((h) => h.ticketNo).join(", ")} (${fmt1(dup.reduce((s, h) => s + h.volume, 0))} bbl), which the ${midMonthLabel()} statement already settled. It also settles ${BOYD.hauls.length} loads on ${BOYD.name}, a lease not on file yet, so saving it will offer the lease, its tank and the runs as cards.`,
    at("15:12", 6)
  );
}

function thread(id: string, title: string, question: string, answer: string, when: number): Conversation {
  return {
    id,
    title,
    createdAt: when,
    updatedAt: when + 40_000,
    messages: [text(`${id}-u1`, "user", question, when), text(`${id}-a1`, "assistant", answer, when + 40_000)],
  };
}

export const ACTIVE_CONVERSATION_ID = "conv-johnson-permit";

export function orionConversations(): Conversation[] {
  return [
    {
      id: ACTIVE_CONVERSATION_ID,
      title: "New permit next to Johnson A",
      createdAt: at("07:12"),
      updatedAt: at("07:12") + 24_000,
      messages: permitThread(),
    },
    smithGaugeThread(),
    corbettDowntimeThread(),
    johnsonTicketsThread(),
    statementThread(),
  ];
}

/** The history list with one of the section threads open on top. */
export function conversationsWith(open: Conversation): Conversation[] {
  return [open, ...orionConversations().filter((c) => c.id !== open.id)];
}

/* ---- Memory, persona and voice ---------------------------------------- */

export const orionPersonaDoc =
  "Keep answers short. Barrels and dollars first, explanation after. I run the Smith pumping units myself, so skip the basics on rod pumps.";

export const orionMemoryDoc = `## ${OPERATOR.name}
- Five leases around ${OPERATOR.city}, ${OPERATOR.county} County, District ${OPERATOR.district}. "The Smith lease" means Smith 1 to 4 on the Smith battery.
- ${OPERATOR.pumper} gauges every lease at 07:00 and writes the week on a paper sheet.
- Oil sells to ${PURCHASERS.oil}. Gas goes to ${PURCHASERS.gas}.
- Johnson A 3 is the Caddo well. Everything else is an old Strawn or Caddo stripper.
- ${RC4.name} is a rod-part well. Check its downtime before reading its decline.`;

export interface FixtureRevision {
  version: number;
  updatedBy: "agent" | "user" | "system";
  rationale: string | null;
  content: string;
}

export const orionRevisions: FixtureRevision[] = [
  {
    version: 3,
    updatedBy: "agent",
    rationale: `Learned that ${RC4.name} parts rods`,
    content: orionMemoryDoc.replace(/\n/g, " "),
  },
  {
    version: 2,
    updatedBy: "user",
    rationale: null,
    content: `## ${OPERATOR.name} - Five leases in ${OPERATOR.county} County. ${OPERATOR.pumper} gauges at 07:00. Oil to ${PURCHASERS.oil}, gas to ${PURCHASERS.gas}.`,
  },
  {
    version: 1,
    updatedBy: "agent",
    rationale: "First facts from onboarding",
    content: `## ${OPERATOR.name} - Five leases in ${OPERATOR.county} County, District ${OPERATOR.district}.`,
  },
];

export function voiceTurns() {
  const n = smithGaugeNumbers();
  const spoken = spokenGauge;
  return {
    user: `Smith T201 gauged ${spoken(n.today.gaugeIn)} this morning.`,
    reply: `That's ${fmt1(n.bbl)} barrels on Smith T201, ${fmt1(n.made)} up from yesterday's ${spoken(n.prev.gaugeIn)}. The card is up. Say approve and I'll save it.`,
  };
}
