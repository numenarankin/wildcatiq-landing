/**
 * The Recon alert email: what is new in an area since the last one.
 *
 * One section per kind the alert watches, newest event first, each row a link
 * that opens that permit or well in Recon. Capped per section, with a link to
 * the rest on the map. The footer says how fresh the mirror is, so a quiet
 * email from a stalled feed reads as stalled rather than as quiet.
 *
 * Pure (no I/O), styled like the scheduled reports email
 * (`src/lib/reports/schedule/email.ts`), so the dispatcher and the dev preview
 * share one body.
 */

import { COUNTY_NAMES } from "@/lib/scout/counties";
import {
  ALERT_KINDS,
  KIND_LABEL,
  MANAGE_ALERTS_PATH,
  alertPath,
  itemPath,
  type AlertKind,
  type ArrivalItem,
} from "./types";

/** The app's `BuiltEmail` (`src/lib/email/brevo.ts`); the sender is not ported. */
export interface BuiltEmail {
  subject: string;
  htmlContent: string;
  textContent: string;
}

const INK = "#0A0A0A";
const BODY = "#4B5563";
const MUTED = "#6B7280";
const RULE = "#E5E7EB";
const FONT =
  "Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Rows shown per section before "View all N in Recon". */
export const SECTION_CAP = 25;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shorter section names for the subject line. */
const SUBJECT_LABEL: Record<AlertKind, string> = {
  pending_permit: "Filed",
  permit: "Approved",
  well: "Wells",
};

export interface ReconAlertEmailInput {
  alertId: string;
  alertName: string;
  countyCodes: number[];
  /** The kinds the alert watches, so an empty-but-watched kind is not invented. */
  kinds: AlertKind[];
  items: ArrivalItem[];
  /** App origin, no trailing slash. */
  baseUrl: string;
  /** The newest arrivals run the send covers (ISO). */
  dataAsOf: string;
  /** One-click "turn this alert off" link, absolute. */
  offUrl: string;
}

function countyList(codes: number[]): string {
  const names = codes.map((c) => COUNTY_NAMES[c] ?? String(c));
  return names.length <= 3
    ? names.join(", ")
    : `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
}

function title(s: string | null): string {
  if (!s) return "";
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/** "Mitchell Ranch 2H", or the key when the RRC gave no name. */
function itemName(item: ArrivalItem): string {
  const name = [title(item.leaseName), item.wellNumber].filter(Boolean).join(" ");
  if (name) return name;
  return item.kind === "well" ? `API 42-${item.key.slice(0, 3)}-${item.key.slice(3)}` : `Permit ${item.key}`;
}

/** The muted half of a row: who, where, what, when. */
function itemDetail(item: ArrivalItem): string {
  const parts = [
    title(item.operatorName),
    COUNTY_NAMES[item.countyCode] ?? null,
    item.purpose,
    item.totalDepth ? `${item.totalDepth.toLocaleString()} ft` : null,
    item.eventDate,
  ];
  return parts.filter(Boolean).join(" · ");
}

/** What the date on a row means, per section. */
const DATE_MEANING: Record<AlertKind, string> = {
  pending_permit: "submitted",
  permit: "issued",
  well: "completion filed",
};

function formatAsOf(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " CT";
}

/** The sections, in a fixed order, newest event first within each. */
export function groupItems(
  kinds: AlertKind[],
  items: ArrivalItem[]
): { kind: AlertKind; items: ArrivalItem[] }[] {
  return ALERT_KINDS.filter((k) => kinds.includes(k))
    .map((kind) => ({
      kind,
      items: items
        .filter((i) => i.kind === kind)
        .sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? "")),
    }))
    .filter((s) => s.items.length > 0);
}

export function reconAlertSubject(
  countyCodes: number[],
  sections: { kind: AlertKind; items: ArrivalItem[] }[]
): string {
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const counts = sections.map((s) => `${SUBJECT_LABEL[s.kind]} ${s.items.length}`).join(", ");
  return `Recon: ${total} new in ${countyList(countyCodes)} (${counts})`;
}

export function reconAlertEmail(input: ReconAlertEmailInput): BuiltEmail {
  const base = input.baseUrl.replace(/\/$/, "");
  const sections = groupItems(input.kinds, input.items);
  const subject = reconAlertSubject(input.countyCodes, sections);
  const manageUrl = `${base}${MANAGE_ALERTS_PATH}`;
  const mapUrl = `${base}${alertPath(input.alertId)}`;
  const asOf = formatAsOf(input.dataAsOf);

  const sectionHtml = sections
    .map(({ kind, items }) => {
      const shown = items.slice(0, SECTION_CAP);
      const rows = shown
        .map(
          (i) =>
            `<tr><td style="padding:7px 0;border-bottom:1px solid ${RULE};font-size:14px;line-height:1.4">` +
            `<a href="${esc(base + itemPath(i))}" style="color:${INK};font-weight:600;text-decoration:none">${esc(itemName(i))}</a>` +
            `<div style="font-size:13px;color:${MUTED}">${esc(itemDetail(i))}</div>` +
            `</td></tr>`
        )
        .join("");
      const more =
        items.length > shown.length
          ? `<tr><td style="padding:8px 0 0;font-size:13px"><a href="${esc(mapUrl)}" style="color:${INK}">View all ${items.length} in Recon</a></td></tr>`
          : "";
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;width:100%">
        <tr><td style="padding-bottom:6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">${esc(KIND_LABEL[kind])} · ${items.length} · date ${esc(DATE_MEANING[kind])}</td></tr>
        ${rows}${more}
      </table>`;
    })
    .join("");

  const htmlContent = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#FFFFFF;font-family:${FONT};color:${INK}">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;width:100%">
    <tr><td>
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">Recon alert · ${esc(input.alertName)}</div>
      <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;color:${INK}">${esc(subject.replace(/^Recon: /, ""))}</h1>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${BODY}">New in ${esc(countyList(input.countyCodes))} since your last alert.</p>
      ${sectionHtml}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr>
          <td style="background:${INK};border-radius:4px">
            <a href="${esc(mapUrl)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none">Open in Recon</a>
          </td>
          <td style="padding-left:16px">
            <a href="${esc(manageUrl)}" style="font-size:14px;color:${MUTED};text-decoration:none">Manage alerts</a>
          </td>
        </tr>
      </table>
      <hr style="margin:28px 0 0;border:0;border-top:1px solid ${RULE}" />
      <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${MUTED}">
        Texas RRC data as of ${esc(asOf)}.
        You are receiving this because you set up the Recon alert "${esc(input.alertName)}".
        <a href="${esc(manageUrl)}" style="color:${MUTED}">Manage alerts</a> ·
        <a href="${esc(input.offUrl)}" style="color:${MUTED}">Turn off this alert</a>
      </p>
    </td></tr>
  </table>
</body></html>`;

  const textContent = [
    `Recon alert · ${input.alertName}`,
    subject,
    "",
    ...sections.flatMap(({ kind, items }) => [
      `${KIND_LABEL[kind]} (${items.length}, date ${DATE_MEANING[kind]}):`,
      ...items
        .slice(0, SECTION_CAP)
        .map((i) => `  - ${itemName(i)}: ${itemDetail(i)}\n    ${base}${itemPath(i)}`),
      ...(items.length > SECTION_CAP ? [`  View all ${items.length} in Recon: ${mapUrl}`] : []),
      "",
    ]),
    `Open in Recon: ${mapUrl}`,
    `Manage alerts: ${manageUrl}`,
    `Turn off this alert: ${input.offUrl}`,
    `Texas RRC data as of ${asOf}.`,
  ].join("\n");

  return { subject, htmlContent, textContent };
}
