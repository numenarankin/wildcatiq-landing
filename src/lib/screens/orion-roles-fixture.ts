/**
 * Orion asked by three different people, one thread each, for the solution
 * pages: the owner asks about money across leases, the office manager about
 * the purchaser's paperwork, the pumper about the equipment in a well.
 *
 * Every figure is computed from the shared fixtures, never typed in: run
 * tickets, prices and the September statement from `documents-tanks.ts` /
 * `documents-fixture.ts` (which read `dashboardFixture()`), NRIs from
 * `operator.ts`. The tool calls are tools the app registers
 * (wildcat `src/lib/ai/tools.ts`), with the inputs Orion would send.
 *
 * The pumper's well is Roy Corbett 4, the well whose rod part every page
 * cites (`EVENTS.rc4Downtime`, `CORBETT_JOB`). Its Info sheet below uses the
 * producer template's field labels (wildcat `well-info-template.ts`).
 */
import type { Conversation } from "@/lib/ai/conversations";
import type { ChartSpec } from "@/lib/ai/chart-spec";
import type { UIMessage } from "@/lib/ai/sdk";
import { CORBETT_JOB, BOYD, STATEMENT_FILE, midMonthLabel, midMonthLease, midMonthRuns, reviewHeader, septemberLeases, septemberLine, uploadLines } from "./documents-fixture";
import { SEPTEMBER, leaseTank } from "./documents-tanks";
import { EVENTS, LEASES, PURCHASERS, WELLS, type LeaseSpec } from "./operator";
import { ORION_TODAY } from "./orion-fixture";

type Part = UIMessage["parts"][number];

const fmt0 = (n: number) => Math.round(n).toLocaleString("en-US");
const fmt1 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usd0 = (n: number) => `$${fmt0(n)}`;
const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const r2 = (n: number) => Math.round(n * 100) / 100;
/** "2026-10-15" -> "Oct 15". */
const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** `ORION_TODAY` at a local wall-clock time, as epoch ms. */
function at(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${ORION_TODAY}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** A completed read with the input Orion sent and the gist of what came back. */
function read(name: string, i: number, input: Record<string, unknown>, output: Record<string, unknown>): Part {
  return { type: `tool-${name}`, toolCallId: `toolu_role_${name}_${i}`, state: "output-available", input, output };
}

function chartPart(id: string, spec: ChartSpec): Part {
  return { type: "tool-render_chart", toolCallId: id, state: "output-available", input: {}, output: spec };
}

function conversation(id: string, title: string, question: string, when: number, after: number, parts: Part[]): Conversation {
  return {
    id,
    title,
    createdAt: when,
    updatedAt: when + after,
    messages: [
      { id: `${id}-u1`, role: "user", metadata: { createdAt: new Date(when).toISOString() }, parts: [{ type: "text", text: question, state: "done" }] },
      { id: `${id}-a1`, role: "assistant", metadata: { createdAt: new Date(when + after).toISOString() }, parts: [{ type: "step-start" }, ...parts] },
    ],
  };
}

const SEPT_FROM = `${SEPTEMBER}-01`;
const SEPT_TO = `${SEPTEMBER}-30`;

/* ---- Owner: which lease pays least per barrel -------------------------- */

/**
 * One lease's September to the owner: the barrels sold, the statement's net
 * (after the purchaser's severance and regulatory withholding), and that net
 * times the lease's NRI, per barrel and in dollars.
 */
export function leaseTakeRows() {
  return septemberLeases().map((l: LeaseSpec) => {
    const { volume, price, runs } = septemberLine(l.id);
    const net = runs.reduce((s, r) => s + (r.netValue ?? 0), 0);
    const toYou = net * l.nri;
    return { lease: l, volume, price, net, toYou, perBbl: toYou / volume };
  });
}

export const OWNER_QUESTION = "Which lease made us the least per barrel in September, and why?";

export function ownerLeaseThread(): Conversation {
  const rows = leaseTakeRows();
  const sorted = [...rows].sort((a, b) => a.perBbl - b.perBbl);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  // The gap per barrel splits exactly into the burden (high's net price on the NRI
  // difference) and the trucking deduct (the price difference on low's NRI).
  const netPerBblHigh = high.net / high.volume;
  const gap = high.perBbl - low.perBbl;
  const burdenPart = netPerBblHigh * (high.lease.nri - low.lease.nri);
  const truckingPart = gap - burdenPart;
  const atHigh = low.volume * high.perBbl;
  const sameDeduct = rows.filter((r) => r.price === low.price).map((r) => r.lease.name);
  const noLoad = LEASES.filter((l) => !rows.some((r) => r.lease.id === l.id)).map((l) => l.name);

  const reply1 = `**${low.lease.name}** at **${usd(low.perBbl)} a barrel** to you, against ${usd(high.perBbl)} on ${high.lease.name}. That is ${PURCHASERS.oil}'s net on September's loads times your NRI on each lease, off the revenue on the ledger.${noLoad.length ? ` ${noLoad.join(" and ")} had no load run in September.` : ""}`;

  const chart: ChartSpec = {
    chartType: "bar",
    title: "September, net to you per barrel sold",
    xKey: "lease",
    yLabel: "$/bbl",
    series: [{ key: "perBbl", label: "Net to you", color: "var(--chart-1)" }],
    data: sorted.map((r) => ({ lease: r.lease.name, perBbl: r2(r.perBbl) })),
  };

  const reply2 = `Two things open the ${usd(gap)} gap:

- **Royalty burden.** ${low.lease.name} carries ${pct(1 - low.lease.nri)} (${pct(low.lease.nri)} NRI), ${high.lease.name} ${pct(1 - high.lease.nri)}. That is ${usd(burdenPart)} of it.
- **Trucking.** ${PURCHASERS.oil} pays ${usd(low.price)} on ${sameDeduct.join(" and ")}, ${usd(high.price - low.price)} under the other leases. That is the other ${usd(truckingPart)}.

Severance comes off every lease at the same rate, so it does not move the order. On the ${fmt1(low.volume)} bbl ${low.lease.name} sold, you took ${usd0(low.toYou)}. On ${high.lease.name}'s terms the same oil would have paid ${usd0(atHigh)}.`;

  const when = at("16:52");
  return conversation("conv-owner-lease-take", "Least per barrel, September", OWNER_QUESTION, when, 22_000, [
    read("list_leases", 0, {}, { leases: LEASES.map((l) => ({ id: l.id, name: l.name, netInterest: l.nri })) }),
    read(
      "list_revenue",
      1,
      { from: SEPT_FROM, to: SEPT_TO },
      { transactions: rows.map((r) => ({ lease: r.lease.name, volume: r.volume, realizedPrice: r.price, amount: r2(r.net), nri: r.lease.nri })) },
    ),
    { type: "text", text: reply1, state: "done" },
    chartPart("toolu_chart_owner_take", chart),
    { type: "text", text: reply2, state: "done" },
  ]);
}

/* ---- Office manager: did the purchaser pay every load ------------------- */

export const OFFICE_QUESTION = `Did ${PURCHASERS.oil} pay us for every load we sold in September?`;

export function officeStatementThread(): Conversation {
  const header = reviewHeader();
  const lines = septemberLeases().map((l) => {
    const { month, volume, runs } = septemberLine(l.id);
    return { lease: l, tank: month.tank.name, loads: runs.length, volume, net: runs.reduce((s, r) => s + (r.netValue ?? 0), 0) };
  });
  const loads = lines.reduce((s, l) => s + l.loads, 0);
  const bbl = lines.reduce((s, l) => s + l.volume, 0);
  const statementNet = uploadLines().reduce((s, l) => s + l.netValue, 0);
  const dup = midMonthRuns()[0];
  const dupLine = septemberLine(midMonthLease()).runs.find((r) => r.ticketNo === dup.ticketNo)!;
  const boydBbl = BOYD.hauls.reduce((s, h) => s + h.volume, 0);
  const boydNet = uploadLines().at(-1)!.netValue;

  const table = [
    "| Lease | Loads | Our tickets (bbl) | Statement (bbl) | Net |",
    "|---|---:|---:|---:|---:|",
    ...lines.map((l) => `| ${l.lease.name} | ${l.loads} | ${fmt1(l.volume)} | ${fmt1(l.volume)} | ${usd(l.net)} |`),
    `| ${BOYD.leaseRef} | ${BOYD.hauls.length} | | ${fmt1(boydBbl)} | ${usd(boydNet)} |`,
  ].join("\n");

  const answer = `Yes. All ${loads} of our September loads, ${fmt1(bbl)} bbl, are on statement ${header.statementNo}, check ${header.checkNo} for ${usd(statementNet)}. Ticket by ticket, the barrels match ours.

${table}

Two lines need you before it posts:

- **Ticket ${dup.ticketNo}** (${fmt1(dup.volume)} bbl off ${leaseTank(midMonthLease()).name}, ${shortDate(dup.date)}) was already paid on the ${midMonthLabel()} mid-month statement, check 48811. It is on this one too, so ${usd(dupLine.netValue ?? 0)} would post twice.
- **${BOYD.leaseRef}** is ${BOYD.hauls.length} loads on tank ${BOYD.tankRef} that match no lease on file. That is the ${BOYD.name} lease. Approve its lease and tank cards from the upload and those runs post with it.`;

  const when = at("16:05");
  return conversation("conv-september-statement", `${PURCHASERS.oil} September, paid in full?`, OFFICE_QUESTION, when, 27_000, [
    read("list_run_tickets", 0, { from: SEPT_FROM, to: SEPT_TO }, { count: loads }),
    read("list_statements", 1, {}, { statements: [{ statementNo: header.statementNo, checkNo: header.checkNo, period: SEPTEMBER, status: "reviewed" }, { statementNo: "BF-2609-0412", checkNo: "48811", status: "reviewed" }] }),
    read("extract_statement", 2, { fileId: "file-stmt-2026-09" }, { ok: true, fileName: STATEMENT_FILE, lines: uploadLines().length }),
    { type: "text", text: answer, state: "done" },
  ]);
}

/* ---- Pumper: what is in Roy Corbett 4 ----------------------------------- */

const RC4 = WELLS.find((w) => w.id === EVENTS.rc4Downtime.well)!;

/**
 * Roy Corbett 4's Info sheet as `get_well_equipment` returns it: producer
 * template labels, the values on file. A 3,700 ft Strawn rod-pump well; the
 * Rods row is the one the pulling-unit ticket wrote (`corbettServiceProposals`).
 */
export const RC4_EQUIPMENT: { label: string; value: string }[] = [
  { label: "Producing method", value: "Rod pump" },
  { label: "Downhole pump", value: "2 x 1-1/4 x 12 RHAC" },
  { label: "SN", value: "3,702 ft" },
  { label: "Tubing", value: "2-3/8 in EUE J-55" },
  { label: "Polish rod", value: "1-1/4 in x 16 ft" },
  { label: "Rods", value: "3/4 in, replaced joint at 3,640 ft" },
  { label: "Rod depth", value: "3,696 ft" },
  { label: "Casing", value: "5-1/2 in 15.5 lb" },
  { label: "Pumping unit", value: "Lufkin C-114D-143-64" },
  { label: "Motor", value: "10 hp electric" },
];

const spec = (label: string) => RC4_EQUIPMENT.find((r) => r.label === label)!.value;

export const PUMPER_QUESTION = `What pump is in ${RC4.name}, and when did they last pull it?`;

/** mobile tool-activity.ts for resolve, get_well_equipment, get_well_service. */
export const PUMPER_READS = ["Finding what you mean", "Checking a well's equipment", "Checking a well's service history"];

export const PUMPER_REPLY = `${RC4.name} has a ${spec("Downhole pump")} on ${spec("Tubing")} tubing, seat nipple at ${spec("SN")}. Rods are ${spec("Rods").split(",")[0]} to ${spec("Rod depth")}.

Last pulled ${shortDate(CORBETT_JOB.date)} by ${CORBETT_JOB.vendor} for a rod part at 3,640 ft. They replaced the joint, the pump tested good and went back in.`;
