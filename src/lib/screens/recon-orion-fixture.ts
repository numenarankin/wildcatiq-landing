/**
 * Orion on Recon: Jim asks what Tonk Creek Operating holds near Sky's wells
 * and what it makes, the question before a bid. One thread in the shape of
 * `orion-fixture.ts`'s, played in the docked drawer over the Recon map.
 *
 * Orion's reads are Recon's own RRC tools (`src/lib/ai/rrc-tools.ts` in the
 * app): `rrc_search` to find the operator, `rrc_operator` for its P-5 and
 * fleet, `rrc_lease` for Harlan Ranch, `rrc_wells_near` for what sits by
 * Sky's wells and `rrc_permits` for what is coming. It ends by moving the map
 * (`scout_set_view`). Every number is computed from `recon-tonk-fixture.ts`,
 * the same series the operator and lease dossiers show, valued at the one
 * price every page uses.
 */
import type { Conversation } from "@/lib/ai/conversations";
import type { UIMessage } from "@/lib/ai/sdk";
import { monthlyRevenue } from "@/lib/scout/revenue";
import { perMonth } from "@/lib/scout/format";
import { PRICES } from "./operator";
import { ORION_TODAY, readPart } from "./orion-fixture";
import {
  HARLAN,
  HARLAN_VIEW,
  HR1,
  LAST12,
  OFFSET_FIRST_YEAR,
  TONK,
  TONK_LEASES,
  TONK_WELLS,
  leaseLast12,
  nearestSky,
  tonkLast12,
  tonkProfile,
  wellOil,
} from "./recon-tonk-fixture";
import { DOSSIER_THROUGH } from "./recon-dossier-fixture";

const fmt0 = (n: number) => Math.round(n).toLocaleString("en-US");
const fmt1 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const usd = (n: number) => `$${fmt0(n)}`;
const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const titleLease = (name: string) =>
  name
    .toLowerCase()
    .replace(/(^|[\s"])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/^Mcc/, "McC")
    .replace(/"a"/i, '"A"');

export const RECON_ORION_QUESTION =
  "Tonk Creek might be selling. What do they hold near our wells, and what does it make?";

/** The camera `scout_set_view` sends: Harlan Ranch, the permit and Johnson A 3 in one view. */
export const RECON_ORION_VIEW = HARLAN_VIEW;

/** The fleet as the operator dossier buckets it. */
function fleet() {
  const p = tonkProfile();
  const n = (k: string) => TONK_WELLS.filter((w) => w.kind === k).length;
  return { total: p.wellCount, producing: n("producing"), shutIn: n("shut-in"), injection: n("injection"), plugged: n("plugged"), leases: p.leaseCount };
}

export function reconOrionAnswer(): string {
  const f = fleet();
  const t = tonkLast12();
  const oilMo = perMonth(t.oil, 12);
  const gasMo = perMonth(t.gas, 12);
  const revenue = monthlyRevenue(oilMo, gasMo, PRICES);
  const rows = TONK_LEASES.map((l) => ({
    l,
    near: nearestSky(l.id),
    last12: leaseLast12(l.id),
    wells: TONK_WELLS.filter((w) => w.lease === l.id && w.kind !== "plugged").length,
  })).sort((a, b) => a.near.miles - b.near.miles);
  const [a, b] = rows;
  const pair = a.last12.oil + b.last12.oil;
  const hr1Now = wellOil(HR1, DOSSIER_THROUGH) / 30.4;
  const hr1First = OFFSET_FIRST_YEAR[0] * (HR1.caddo?.share ?? 1);
  // The old wells' rates in the last cycle, for the stripper line.
  const strawn = TONK_WELLS.filter((w) => w.kind === "producing" && !w.caddo && w.lease !== a.l.id && w.lease !== b.l.id).map(
    (w) => wellOil(w, DOSSIER_THROUGH) / 30.4
  );
  const permit = tonkProfile().permits[0];
  const approved = new Date(`${permit.issued_date}T12:00:00Z`).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return `**${titleLease(TONK.name).replace(/ Llc$/, " LLC")}** (P-5 ${TONK.no}, active, Graham) holds ${f.leases} oil leases and ${f.total} wellbores, all in Young County: ${f.producing} producing, ${f.shutIn} shut in, ${f.injection} injection and ${f.plugged} plugged. Over the last 12 reported months (${monthLabel(LAST12[0])} to ${monthLabel(LAST12[LAST12.length - 1])}) the leases made **${fmt0(t.oil)} bbl** of oil and ${fmt0(t.gas)} MCF of casinghead, about ${fmt0(oilMo)} bbl and ${fmt0(gasMo)} MCF a month, or **${usd(revenue)} a month** gross at $${PRICES.oilPerBbl.toFixed(2)} and $${PRICES.gasPerMcf.toFixed(2)}.

| Lease | Wells | Nearest Sky lease | Oil, 12 mo (bbl) | Gas, 12 mo (MCF) |
|---|---:|---|---:|---:|
${rows.map((r) => `| ${titleLease(r.l.name)} | ${r.wells} | ${r.near.lease}, ${fmt1(r.near.miles)} mi | ${fmt0(r.last12.oil)} | ${fmt0(r.last12.gas)} |`).join("\n")}

The two closest are the two worth paying for. **${titleLease(a.l.name)}** and **${titleLease(b.l.name)}** sit ${fmt1(a.near.miles)} and ${fmt1(b.near.miles)} mi from your ${a.near.lease} wells and made ${fmt0(pair)} bbl between them, ${Math.round((100 * pair) / t.oil)}% of the company's oil, most of it from their three Caddo wells from 2024 and 2025. The other six are Strawn strippers making ${fmt1(Math.min(...strawn))} to ${fmt1(Math.max(...strawn))} bbl/d a well.

Price in two things. The Caddo wells fall fast: ${titleLease(HARLAN.name)} 1 came on at ${fmt1(hr1First)} bbl/d and made ${fmt1(hr1Now)} bbl/d in ${monthLabel(DOSSIER_THROUGH)}. And ${titleLease(permit.lease_name ?? HARLAN.name)} ${permit.well_number} is permitted on the same lease, approved ${approved}, so a buyer gets the location too. I put ${titleLease(HARLAN.name)} on the map.`;
}

function at(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${ORION_TODAY}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function reconOrionThread(): Conversation {
  const when = at("08:12");
  const user: UIMessage = {
    id: "conv-tonk-u1",
    role: "user",
    metadata: { createdAt: new Date(when).toISOString() },
    parts: [{ type: "text", text: RECON_ORION_QUESTION, state: "done" }],
  };
  const reply: UIMessage = {
    id: "conv-tonk-a1",
    role: "assistant",
    metadata: { createdAt: new Date(when + 24_000).toISOString() },
    parts: [
      { type: "step-start" },
      readPart("rrc_search", 0),
      readPart("rrc_operator", 1),
      readPart("rrc_wells_near", 2),
      readPart("rrc_lease", 3),
      readPart("rrc_permits", 4),
      { type: "text", text: reconOrionAnswer(), state: "done" },
      { type: "tool-scout_set_view", toolCallId: "toolu_scout_view_tonk", state: "output-available", input: {}, output: { ok: true } },
    ],
  };
  return {
    id: "conv-tonk-holdings",
    title: "Tonk Creek holdings",
    createdAt: when,
    updatedAt: when + 24_000,
    messages: [user, reply],
  };
}
