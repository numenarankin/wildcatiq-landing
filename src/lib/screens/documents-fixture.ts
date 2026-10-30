/**
 * The Documents page's fixture, in the app's own shapes.
 *
 * Two kinds of paper, both derived from the operator's tanks
 * (`documents-tanks.ts`, which derives from the dashboard's production):
 *
 * - Brushy Fork Crude's September run statement (a fictional purchaser), as the Revenue page's
 *   statement upload hands it to the review grid (`Statement`, `ReviewHeader`,
 *   `ReviewLine`, `StatementWarning`). Each lease line is the barrels the purchaser
 *   hauled off that lease's tank in September, run by run.
 * - The ingest proposals the approval card opens on (`IngestProposal`): the
 *   Smith T201 gauge sheet from a tank's Add History, the Roy Corbett 4 rod job
 *   from the well page, and the September GreaseBook export.
 */
import type {
  EntityOption,
  ReviewHeader,
  ReviewLine,
} from "@/components/statements/statement-review";
import type { StatementWarning } from "@/lib/statements/checks";
import type { Statement } from "@/lib/statements/statements";
import type { StatementRun } from "@/lib/statements/line-runs";
import type { IngestProposal, WellOption } from "@/lib/ai/ingest/actions";
import { dashboardFixture } from "./dashboard-fixture";
import { EVENTS, LEASES as OP_LEASES, OIL_PURCHASER, OPERATOR, PURCHASERS, WELLS } from "./operator";
import { RRC_LEASE_NO } from "./recon-rrc";
import {
  GAUGE_TIME,
  SEPTEMBER,
  SMITH_OCT_HAUL,
  haulTotal,
  leaseTank,
  smithWeekGauges,
  tankMonthOf,
  tankMonths,
} from "./documents-tanks";

export const STATEMENT_FILE = `${OIL_PURCHASER.fileStem}-2026-09.pdf`;

/** Texas crude severance tax (4.6%) plus the regulatory fee, as the purchaser withholds it. */
const TAX_RATE = 0.046 + 0.001917;

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** RRC lease numbers, as the statement prints them: the same numbers Recon and the Form PR carry. */
const LEASE_NO: Record<string, string> = RRC_LEASE_NO;

/** The purchaser's posted price less each lease's trucking deduct, $/bbl. */
export const LEASE_PRICE: Record<string, number> = {
  "l-johnson": 60.12,
  "l-smith": 60.12,
  "l-corbett": 59.88,
  "l-young": 59.88,
  "l-parrott": 60.12,
};

export const LEASES: EntityOption[] = OP_LEASES.map((l) => ({
  id: l.id,
  label: `${l.name} · ${LEASE_NO[l.id]}`,
  name: l.name,
  number: LEASE_NO[l.id],
}));

const tankNo = (name: string) => name.replace(/^.*T(\d+)$/, "$1");

export const TANKS: EntityOption[] = [
  { id: "t-ja-101", label: "Johnson A T101", name: "Johnson A T101", number: "101" },
  { id: "t-ja-102", label: "Johnson A T102", name: "Johnson A T102", number: "102" },
  { id: "t-sm-201", label: "Smith T201", name: "Smith T201", number: "201" },
  { id: "t-rc-301", label: "Roy Corbett T301", name: "Roy Corbett T301", number: "301" },
  { id: "t-fy-401", label: "Fannie Young T401", name: "Fannie Young T401", number: "401" },
  { id: "t-rp-501", label: "Roach Parrott T501", name: "Roach Parrott T501", number: "501" },
];

export const METERS: EntityOption[] = [
  { id: "meter-l-johnson", label: "Johnson A M1", name: "Johnson A M1", number: "1" },
  { id: "meter-l-smith", label: "Smith M1", name: "Smith M1", number: "1" },
];

/* ---- The statements on file ------------------------------------------- */

interface OnFile {
  id: string;
  periodStart: string;
  periodEnd: string;
  statementNo: string;
  checkNo: string;
  oil: number;
  price: number;
  createdAt: string;
}

/** Company oil for a month, the dashboard's monthly total. */
/** The barrels the purchaser ran in a month, every lease: the loads in the dashboard's record. */
function companyMonthSold(month: string): number {
  return r1(dashboardFixture().runTickets.filter((t) => t.date.startsWith(month)).reduce((a, t) => a + t.bbl, 0));
}

/**
 * The mid-month run statement: the purchaser settled September's first load
 * on its own, and the full September statement repeats it.
 */
export function midMonthLease(): string {
  const first = tankMonths(SEPTEMBER)
    .flatMap((m) => m.hauls.map((h) => ({ leaseId: m.leaseId, date: h.date })))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return first.leaseId;
}

export function midMonthRuns() {
  const m = tankMonthOf(midMonthLease());
  return m.hauls.slice(0, 1);
}

/** The mid-month statement's last day: the day of the load it settled. */
export const midMonthEnd = () => midMonthRuns()[0].date;

/** "2026-09-13" -> "Sep 13". */
const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
export const midMonthLabel = () => shortDate(midMonthEnd());

function onFile(): OnFile[] {
  return [
    {
      id: "stmt-2026-09a",
      periodStart: "2026-09-01",
      periodEnd: midMonthEnd(),
      statementNo: "BF-2609-0412",
      checkNo: "48811",
      oil: r1(midMonthRuns().reduce((s, h) => s + h.volume, 0)),
      price: LEASE_PRICE[midMonthLease()],
      createdAt: "2026-09-18T15:02:00Z",
    },
    {
      id: "stmt-2026-08",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      statementNo: "BF-2608-1102",
      checkNo: "48533",
      oil: companyMonthSold("2026-08"),
      price: 61.4,
      createdAt: "2026-09-08T14:21:00Z",
    },
    {
      id: "stmt-2026-07",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      statementNo: "BF-2607-1077",
      checkNo: "48190",
      oil: companyMonthSold("2026-07"),
      price: 62.05,
      createdAt: "2026-08-07T13:48:00Z",
    },
    {
      id: "stmt-2026-06",
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      statementNo: "BF-2606-1031",
      checkNo: "47862",
      oil: companyMonthSold("2026-06"),
      price: 64.3,
      createdAt: "2026-07-09T16:10:00Z",
    },
  ];
}

/** The statements on file, newest first, as `getStatements` lists them. */
export function statementsOnFile(): Statement[] {
  return onFile().map((s) => {
    const gross = r2(s.oil * s.price);
    const taxes = r2(gross * TAX_RATE);
    return {
      id: s.id,
      purchaserId: "p-brushy-fork",
      purchaser: PURCHASERS.oil,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      product: "oil",
      status: "reviewed",
      statementNo: s.statementNo,
      checkNo: s.checkNo,
      storageKey: `statements/${s.id}.pdf`,
      fileName: `${OIL_PURCHASER.fileStem}-${s.periodStart.slice(0, 7)}.pdf`,
      mime: "application/pdf",
      size: 184_320,
      totalOilBbls: s.oil,
      totalGasMcf: 0,
      totalValue: r2(gross - taxes),
      totalDeducts: 0,
      totalTaxes: taxes,
      notes: "",
      raw: {},
      createdAt: s.createdAt,
    };
  });
}

export function reviewHeader(): ReviewHeader {
  return {
    purchaser: PURCHASERS.oil,
    statementNo: "BF-2609-1188",
    checkNo: "49027",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
    product: "oil",
    notes: "",
  };
}

/** API gravity on every run this month: North Texas sweet. */
export const RUN_GRAVITY = 40.1;

/** One lease's September settlement: its hauls, at its price. */
export function septemberLine(leaseId: string) {
  const month = tankMonthOf(leaseId, SEPTEMBER);
  const price = LEASE_PRICE[leaseId];
  const runs: StatementRun[] = month.hauls.map((h) => {
    const grossValue = r2(h.volume * price);
    const taxes = r2(grossValue * TAX_RATE);
    return {
      runDate: h.date,
      ticketNo: h.ticketNo,
      tankRef: tankNo(month.tank.name),
      transporter: OIL_PURCHASER.transporter,
      gravity: RUN_GRAVITY,
      volume: h.volume,
      price,
      grossValue,
      taxes,
      netValue: r2(grossValue - taxes),
    };
  });
  return { month, price, volume: haulTotal(month), runs };
}

/** The leases the purchaser ran oil off in September: a lease with no load is not on the statement. */
export const septemberLeases = () => OP_LEASES.filter((l) => tankMonthOf(l.id, SEPTEMBER).hauls.length > 0);

/** The settlement lines as the extraction returns them, matched to leases and tanks on file. */
export function reviewLines(): ReviewLine[] {
  return septemberLeases().map((l) => {
    const { month, price, volume, runs } = septemberLine(l.id);
    const grossValue = r2(volume * price);
    const taxes = r2(grossValue * TAX_RATE);
    return {
      leaseId: l.id,
      tankId: month.tank.id,
      meterId: null,
      leaseRef: `${l.name.toUpperCase()} ${LEASE_NO[l.id]}`,
      tankRef: tankNo(month.tank.name),
      meterRef: "",
      product: "oil",
      volume,
      price,
      grossValue,
      deducts: 0,
      taxes,
      netValue: r2(grossValue - taxes),
      mmbtu: null,
      allocatedQty: null,
      producerPct: null,
      settleQty: null,
      fees: 0,
      raw: { runs },
    };
  });
}

/** September's statement totals, for any page that quotes them. */
export function septemberTotals() {
  const lines = reviewLines();
  return {
    loads: tankMonths(SEPTEMBER).reduce((s, m) => s + m.hauls.length, 0),
    bbl: r1(lines.reduce((s, l) => s + l.volume, 0)),
    net: r2(lines.reduce((s, l) => s + l.netValue, 0)),
  };
}

/**
 * The line-level finding on the lease with September's first load: that load
 * is the one the mid-month run statement (check 48811) already settled. The grid reads `code`
 * only to hide `unmatched-lease`; the app has no line-level duplicate code, so
 * the finding rides on the total check and the message carries the fact.
 */
export function reviewWarnings(): StatementWarning[] {
  const dup = midMonthRuns();
  const bbl = r1(dup.reduce((s, h) => s + h.volume, 0));
  const tickets = dup.map((h) => h.ticketNo).join(" and ");
  const leaseId = midMonthLease();
  return [
    {
      code: "total-mismatch",
      statement: 0,
      line: septemberLeases().findIndex((l) => l.id === leaseId),
      message: `Duplicate of the ${midMonthLabel()} statement on file (check 48811): ticket ${tickets} on ${leaseTank(leaseId).name}, ${bbl.toFixed(1)} bbl at $${LEASE_PRICE[leaseId].toFixed(2)}, is already in the ledger. Remove it from this line or the revenue posts twice.`,
    },
  ];
}

/* ---- The lease new this month ---------------------------------------- */

/**
 * The Boyd lease: the acquisition closed in August and nothing of it is on
 * file, so September's statement is the first paper to name it. Its line
 * matches no lease and no tank, the review shows both refs as new, and the
 * save proposes the lease, its tank and its hauls as approval cards. It is
 * not in `operator.ts` and not on the dashboard, which is the point: it is
 * what the upload puts on file. `reviewLines` and `septemberTotals` stay the
 * leases on file; `uploadLines` is the statement as printed.
 */
export const BOYD = {
  leaseRef: "BOYD 30418",
  leaseNo: "30418",
  name: "Boyd",
  tankRef: "601",
  tankName: "Boyd T601",
  price: 60.12,
  hauls: [
    { date: "2026-09-06", ticketNo: "771266", volume: 138.4 },
    { date: "2026-09-16", ticketNo: "771612", volume: 137.1 },
    { date: "2026-09-26", ticketNo: "771930", volume: 136.8 },
  ],
} as const;

export function boydLine(): ReviewLine {
  const runs: StatementRun[] = BOYD.hauls.map((h) => {
    const grossValue = r2(h.volume * BOYD.price);
    const taxes = r2(grossValue * TAX_RATE);
    return {
      runDate: h.date,
      ticketNo: h.ticketNo,
      tankRef: BOYD.tankRef,
      transporter: OIL_PURCHASER.transporter,
      gravity: RUN_GRAVITY,
      volume: h.volume,
      price: BOYD.price,
      grossValue,
      taxes,
      netValue: r2(grossValue - taxes),
    };
  });
  const volume = r1(runs.reduce((s, r) => s + r.volume, 0));
  const grossValue = r2(volume * BOYD.price);
  const taxes = r2(grossValue * TAX_RATE);
  return {
    leaseId: null,
    tankId: null,
    meterId: null,
    leaseRef: BOYD.leaseRef,
    tankRef: BOYD.tankRef,
    meterRef: "",
    product: "oil",
    volume,
    price: BOYD.price,
    grossValue,
    deducts: 0,
    taxes,
    netValue: r2(grossValue - taxes),
    mmbtu: null,
    allocatedQty: null,
    producerPct: null,
    settleQty: null,
    fees: 0,
    raw: { runs },
  };
}

/** The statement as printed: the leases on file that ran oil, then Boyd. */
export function uploadLines(): ReviewLine[] {
  return [...reviewLines(), boydLine()];
}

/** The upload on file once Save statement lands, as the table lists it above the rest. */
export function savedStatement(): Statement {
  const lines = uploadLines();
  const taxes = r2(lines.reduce((n, l) => n + l.taxes, 0));
  return {
    id: "stmt-2026-09",
    purchaserId: "p-brushy-fork",
    purchaser: PURCHASERS.oil,
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
    product: "oil",
    status: "reviewed",
    statementNo: "BF-2609-1188",
    checkNo: "49027",
    storageKey: "statements/stmt-2026-09.pdf",
    fileName: STATEMENT_FILE,
    mime: "application/pdf",
    size: 201_114,
    totalOilBbls: r1(lines.reduce((n, l) => n + l.volume, 0)),
    totalGasMcf: 0,
    totalValue: r2(lines.reduce((n, l) => n + l.netValue, 0)),
    totalDeducts: 0,
    totalTaxes: taxes,
    notes: "",
    raw: {},
    createdAt: "2026-10-27T15:41:00Z",
  };
}

/**
 * What the save proposes as approval cards, in the order the app queues them:
 * the lease the statement named that is not on file, the tank its runs were
 * settled under, then every haul on the statement as a run ticket. The
 * purchaser is on file already, so no card for it. Row keys are the ingest
 * schemas' fields in their order.
 */
export function savedProposals(): IngestProposal[] {
  const at = "2026-10-27T15:41:02Z";
  const base = { fileName: STATEMENT_FILE, wellId: null, tankId: null, meterId: null, status: "pending", createdAt: at };
  return [
    {
      ...base,
      id: "prop-leases",
      type: "leases",
      rows: [{ leaseNo: BOYD.leaseNo, name: BOYD.name, county: OPERATOR.county, active: true, sourceText: BOYD.leaseRef }],
    },
    {
      ...base,
      id: "prop-tanks",
      type: "tanks",
      rows: [
        {
          name: BOYD.tankName,
          product: "oil",
          tankNo: BOYD.tankRef,
          lease: BOYD.name,
          battery: "",
          gatherer: PURCHASERS.oil,
          bblPerInch: 1.67,
          capacityBbls: 500,
          active: true,
          sourceText: `${BOYD.leaseRef} ${BOYD.tankRef}`,
        },
      ],
    },
    {
      ...base,
      id: "prop-run-tickets",
      type: "runTickets",
      rows: uploadLines().flatMap((l) =>
        (l.raw as { runs: StatementRun[] }).runs.map((r) => ({
          tankRef: `${l.leaseRef} ${l.tankRef}`,
          date: r.runDate,
          departureTime: "",
          ticketNo: r.ticketNo,
          ticketType: "run",
          grossBbls: r.volume,
          netBbls: r.volume,
          apiGravity: r.gravity,
          bsW: null,
          openingGauge: null,
          closingGauge: null,
          purchaser: PURCHASERS.oil,
          transporter: r.transporter,
          product: "oil",
          price: r.price,
          grossValue: r.grossValue,
          taxes: r.taxes,
          netValue: r.netValue,
        }))
      ),
    },
  ];
}

export function documentsFixture() {
  return {
    statements: statementsOnFile(),
    saved: savedStatement(),
    proposals: savedProposals(),
    leases: LEASES,
    tanks: TANKS,
    meters: METERS,
    header: reviewHeader(),
    lines: uploadLines(),
    warnings: reviewWarnings(),
    fileName: STATEMENT_FILE,
  };
}

/* ---- Ingest proposals ------------------------------------------------- */

/** The wells the approval card's picker lists, operator order. */
export const wellOptions: WellOption[] = WELLS.map((w) => ({ id: w.id, name: w.name }));

/** The photo of Smith T201's gauge sheet a pumper uploads through Add History. */
export const GAUGE_SHEET_FILE = "smith-t201-gauge-sheet-2026-10.jpg";
export const GREASEBOOK_FILE = "greasebook-smith-t201-2026-09.xlsx";
/**
 * The pulling-unit ticket as Luis filed it from the phone's Files scanner (one
 * PDF of its two pages, in Scans: `documents-files-fixture.ts` SCANNED_TICKET),
 * the name he typed plus the ".pdf" the scanner adds.
 */
export const CORBETT_TICKET_NAME = "Brazos Bend ticket 20417";
export const CORBETT_TICKET_FILE = `${CORBETT_TICKET_NAME}.pdf`;

const smithTank = () => leaseTank("l-smith");

/**
 * The gauge sheet, read: seven morning gauges on Smith T201 (Oct 20 to 26,
 * ending on the 3 ft 4.5 in reading every page cites), then the Oct 23 haul
 * the sheet also records, which arrives flagged because the purchaser's ticket for
 * that day is already on file.
 */
export function gaugeSheetProposals(): IngestProposal[] {
  const tank = smithTank();
  const ref = tankNo(tank.name);
  const week = smithWeekGauges();
  const before = week.find((g) => g.date === SMITH_OCT_HAUL.date)!.gaugeIn;
  const after = Math.round(((before * tank.bblPerInch - SMITH_OCT_HAUL.volume) / tank.bblPerInch) * 4) / 4;
  return [
    {
      id: "ip-smith-gauges",
      type: "tankReadings",
      fileName: GAUGE_SHEET_FILE,
      wellId: null,
      tankId: tank.id,
      meterId: null,
      rows: week.map((g) => ({ tankRef: ref, date: g.date, time: g.time, gauge: g.gaugeIn })),
      status: "pending",
      createdAt: "2026-10-27T13:02:00Z",
    },
    {
      id: "ip-smith-run",
      type: "runTickets",
      fileName: GAUGE_SHEET_FILE,
      wellId: null,
      tankId: tank.id,
      meterId: null,
      rows: [
        {
          tankRef: ref,
          date: SMITH_OCT_HAUL.date,
          departureTime: SMITH_OCT_HAUL.time,
          ticketNo: SMITH_OCT_HAUL.ticketNo,
          grossBbls: SMITH_OCT_HAUL.volume,
          openingGauge: before,
          closingGauge: after,
          purchaser: PURCHASERS.oil,
          _notice: `A run is already on file for this tank on ${SMITH_OCT_HAUL.date}. Check this is not the same haul.`,
        },
      ],
      status: "pending",
      createdAt: "2026-10-27T13:02:00Z",
    },
  ];
}

/** Roy Corbett 4's rod part, inside the downtime every page cites (EVENTS.rc4Downtime). */
export const CORBETT_JOB = {
  date: "2026-10-15",
  job: "Pull rods, replace parted 3/4 in rod, rerun pump",
  vendor: "Brazos Bend Well Service",
  cost: 4380,
  notes: "Ticket 20417. Rod parted at 3,640 ft. Pump tested good, rerun.",
} as const;

/**
 * The pulling-unit ticket dropped on Roy Corbett 4's page: one job, three
 * records. The service row first, then the downtime and the pump spec.
 */
export function corbettServiceProposals(): IngestProposal[] {
  const dt = EVENTS.rc4Downtime;
  return [
    {
      id: "ip-rc4-service",
      type: "service",
      fileName: CORBETT_TICKET_FILE,
      wellId: dt.well,
      tankId: null,
      meterId: null,
      rows: [{ date: CORBETT_JOB.date, job: CORBETT_JOB.job, vendor: CORBETT_JOB.vendor, cost: CORBETT_JOB.cost, notes: CORBETT_JOB.notes }],
      status: "pending",
      createdAt: "2026-10-27T13:20:00Z",
    },
    {
      id: "ip-rc4-downtime",
      type: "downtime",
      fileName: CORBETT_TICKET_FILE,
      wellId: dt.well,
      tankId: null,
      meterId: null,
      rows: [{ eventType: "downtime", startDate: dt.from, endDate: dt.to, reason: "Rod part" }],
      status: "pending",
      createdAt: "2026-10-27T13:20:00Z",
    },
    {
      id: "ip-rc4-equipment",
      type: "wellEquipment",
      fileName: CORBETT_TICKET_FILE,
      wellId: dt.well,
      tankId: null,
      meterId: null,
      rows: [{ label: "Rods", value: "3/4 in, replaced joint at 3,640 ft" }],
      status: "pending",
      createdAt: "2026-10-27T13:20:00Z",
    },
  ];
}

/**
 * Smith T201's September out of GreaseBook: thirty morning gauges, then the
 * month's hauls. Production over the month is the hauls plus the change in
 * stock, which is Smith's September oil on the dashboard.
 */
export function greasebookProposals(): IngestProposal[] {
  const month = tankMonthOf("l-smith", SEPTEMBER);
  const ref = tankNo(month.tank.name);
  return [
    {
      id: "ip-gb-gauges",
      type: "tankReadings",
      fileName: GREASEBOOK_FILE,
      wellId: null,
      tankId: month.tank.id,
      meterId: null,
      rows: month.gauges.map((g) => ({ tankRef: ref, date: g.date, time: GAUGE_TIME, gauge: g.gaugeIn })),
      status: "pending",
      createdAt: "2026-10-27T13:40:00Z",
    },
    {
      id: "ip-gb-runs",
      type: "runTickets",
      fileName: GREASEBOOK_FILE,
      wellId: null,
      tankId: month.tank.id,
      meterId: null,
      rows: month.hauls.map((h) => ({
        tankRef: ref,
        date: h.date,
        departureTime: h.time,
        ticketNo: h.ticketNo,
        grossBbls: h.volume,
        openingGauge: h.openIn,
        closingGauge: h.closeIn,
        purchaser: PURCHASERS.oil,
      })),
      status: "pending",
      createdAt: "2026-10-27T13:40:00Z",
    },
  ];
}
