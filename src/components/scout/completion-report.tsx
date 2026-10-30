"use client";

import { Panel, Row } from "./modal-ui";
import { titleCase } from "@/lib/scout/format";
import type { CompletionReport } from "@/lib/scout/rrc-types";

/**
 * One filed W-2 (oil) or G-1 (gas) completion report, as the well dossier
 * shows it. The permit panel renders the same component for the hole a permit
 * became, so a packet reads the same wherever it is opened.
 *
 * Only the FORMATION record is rendered. The packet also carries casing, and
 * so does the Well Bore Database the dossier shows beside this: 78,164 of the
 * 79,173 wells that have a report also have Well Bore Database casing, so
 * showing both would put two casing lists on nearly every well — two
 * internally-correct answers to one question, which reads as a discrepancy to
 * hunt down rather than as two filings. One list, from one source, stated.
 *
 * Formations are what nothing else carries: the rock the bit went through, at
 * what depth, and which zones the operator certified as isolated.
 */
export function CompletionReportPanel({ report: rep }: { report: CompletionReport }) {
  return (
    <Panel
      title={`Completion report · ${
        rep.completion_date ?? rep.approved_date ?? "date not recorded"
      }`}
    >
      <div className="px-4 py-2">
        <Row label="Purpose" value={titleCase(rep.purpose_of_filing)} />
        <Row label="Type" value={titleCase(rep.completion_type)} />
        <Row label="Profile" value={titleCase(rep.wellbore_profile)} />
        <Row label="Spudded" value={rep.spud_date} />
        <Row label="Approved" value={rep.approved_date} />
        <Row
          label="Lease acreage"
          value={rep.total_acres ? `${Number(rep.total_acres).toLocaleString()} ac` : null}
        />
        <Row label="Producing wells on lease" value={rep.producing_wells} />
        <Row
          label="Survey"
          value={[
            titleCase(rep.survey),
            rep.survey_block ? `Blk ${rep.survey_block}` : null,
            rep.survey_section ? `Sec ${rep.survey_section}` : null,
            rep.survey_abstract,
          ]
            .filter(Boolean)
            .join(" · ")}
        />

        {rep.formations.length > 0 && (
          <>
            <div className="border-t pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Formations
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {rep.formations.map((f, j) => (
                  <tr key={j}>
                    <td className="py-0.5 pr-3">
                      {titleCase(f.formation) || "—"}
                      {f.remark && (
                        <span className="ml-1.5 text-[11px] text-muted-foreground">
                          {f.remark}
                        </span>
                      )}
                    </td>
                    <td className="py-0.5 pr-3 text-right text-xs text-muted-foreground">
                      {/* Isolated is the one that carries weight: it is the
                          operator certifying they cased a zone off.
                          "Encountered" alone is just "the bit went through it". */}
                      {f.isolated === "Y"
                        ? "isolated"
                        : f.encountered === "Y"
                          ? "encountered"
                          : ""}
                    </td>
                    <td className="w-24 py-0.5 text-right font-medium tabular-nums">
                      {f.depth ? `${Number(f.depth).toLocaleString()} ft` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {rep.otherSections.length > 0 && (
          <div className="border-t pt-2 text-[11px] text-muted-foreground">
            Also in this packet:{" "}
            {rep.otherSections.map((o) => `${titleCase(o.tag)} (${o.rows})`).join(", ")}
          </div>
        )}
      </div>
    </Panel>
  );
}
