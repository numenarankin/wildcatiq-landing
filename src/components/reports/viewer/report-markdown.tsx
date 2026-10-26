import type { ReactElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BarChartDom, PieChartDom } from "@/lib/reports/digest/charts-dom";
import { CoverageChartDom } from "@/lib/reports/pumper/chart-dom";
import { NarrateButton } from "@/components/reports/viewer/narrate-button";
import { ReportHeader } from "@/components/reports/viewer/report-header";
import { KPI_FENCE, parseKpiSpec } from "@/lib/reports/digest/kpi-embed";
import type { KpiTile } from "@/lib/reports/digest/kpi-tiles";
import {
  CHART_FENCE,
  parseChartSpec,
  type BarChartSpec,
  type ChartValueFormat,
  type CoverageChartSpec,
  type DigestChartSpec,
  type PieChartSpec,
} from "@/lib/reports/digest/chart-embed";

/** The slice of a hast node `isTotalTr` reads. */
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
};

/**
 * A table's total row, as `tableToMarkdown` writes it: every filled cell is one
 * bold run. The same rule as `isMarkdownTotalRow`, read off the parsed tree.
 */
function isTotalTr(node: HastNode | undefined): boolean {
  const cells = (node?.children ?? []).filter((c) => c.tagName === "td");
  const filled = cells
    .map((td) =>
      (td.children ?? []).filter(
        (c) => !(c.type === "text" && !(c.value ?? "").trim())
      )
    )
    .filter((kids) => kids.length > 0);
  return (
    filled.length > 0 &&
    filled.every((kids) => kids.length === 1 && kids[0].tagName === "strong")
  );
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** A pie legend's value formatter, named in the spec (JSON carries no functions). */
function formatter(format: ChartValueFormat): (n: number) => string {
  if (format === "usd") return (n) => usd.format(n);
  if (format === "bbl") return (n) => `${num0.format(n)} bbl`;
  return (n) => String(Math.round(n));
}

/** One chart from a ```chart fence, drawn by the same code the PDF uses. */
function Chart({
  spec,
}: {
  spec: BarChartSpec | PieChartSpec | CoverageChartSpec;
}): ReactElement {
  if (spec.kind === "bar") {
    return (
      <BarChartDom
        title={spec.title}
        series={spec.series}
        color={spec.color}
        label={spec.label}
        second={spec.second}
        width={spec.width}
      />
    );
  }
  if (spec.kind === "coverage") {
    // The Pumper Report's line, drawn by the pumper report's own chart code.
    return (
      <CoverageChartDom
        title={spec.title}
        series={spec.series}
        averagePct={spec.averagePct}
        width={spec.width}
      />
    );
  }
  return (
    <PieChartDom
      title={spec.title}
      data={spec.data}
      format={formatter(spec.format)}
      width={spec.width}
    />
  );
}

function ChartBlock({ spec }: { spec: DigestChartSpec }): ReactElement {
  if (spec.kind === "row") {
    // Columns sized by each chart's intrinsic width, so the row divides exactly
    // as it does on the PDF page (the trend chart two thirds, the pie one third)
    // and both scale by the same factor as the full-width charts above them.
    return (
      <div className="mb-8 flex flex-wrap items-start gap-6">
        {spec.charts.map((c, i) => (
          <div
            key={i}
            className="min-w-[14rem]"
            style={{ flexGrow: c.width ?? 1, flexBasis: 0 }}
          >
            <Chart spec={c} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mb-8">
      <Chart spec={spec} />
    </div>
  );
}

/**
 * The headline stat tiles, as cards - the PDF's tile row in DOM form: label,
 * figure, and the move under it coloured the same way (the greens and reds are
 * the document's literal hexes, so a tile reads identically in both).
 */
function KpiCards({ tiles }: { tiles: KpiTile[] }) {
  return (
    <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="border-border rounded-sm border px-3 py-2.5"
        >
          <div className="text-muted-foreground text-[0.7rem] tracking-wider uppercase">
            {tile.label}
          </div>
          <div className="mt-1 text-lg font-semibold">{tile.value}</div>
          {tile.note ? (
            // The move is the second thing read after the figure; at 10px it
            // was decoration rather than information.
            <div
              className="mt-1 text-xs font-medium"
              style={{
                color:
                  tile.tone === "up"
                    ? "#059669"
                    : tile.tone === "down"
                      ? "#B00020"
                      : undefined,
              }}
            >
              {tile.note}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** The fenced block's language and body, when react-markdown hands us a `pre`. */
function fenceOf(children: ReactNode): { lang: string; body: string } | null {
  const child = Array.isArray(children) ? children[0] : children;
  const props = (child as { props?: { className?: string; children?: ReactNode } })
    ?.props;
  if (!props) return null;
  const lang = /language-(\w+)/.exec(props.className ?? "")?.[1] ?? "";
  return { lang, body: String(props.children ?? "") };
}

/**
 * A report as the page renders it: the whole document as markdown.
 *
 * Reading a report as text beats reading it through an embedded PDF viewer for
 * everything except page layout - the numbers, column order, headers, blanks and
 * totals are all right here, selectable and searchable, with no PDF engine in
 * the way. It is the WHOLE document: a composite report's narrative, exceptions,
 * KPI table and CHARTS all come through - the charts being the PDF's own chart
 * components, rendered to DOM SVG (see `digestToMarkdown` and `charts-dom`), so
 * nothing is lost or approximated by reading it here. The PDF view
 * answers only what page layout can: pagination, the header band, how a chart is
 * drawn.
 *
 * Scrolls with the page (no pane of its own), and the header row is sticky
 * under the app header, so scrolling a 180-row table keeps its column labels in
 * view the way a spreadsheet's frozen first row does. Cells wrap rather than
 * scroll sideways: an `overflow-x` wrapper would become the sticky header's
 * scroll container and pin it to the top of the table instead of the viewport.
 */
export function ReportMarkdown({
  markdown,
  narration,
  actions,
  pickers,
}: {
  markdown: string;
  /** What Orion says when asked to read this report (see `narrateMarkdown`). */
  narration: string;
  /**
   * The page's actions (View in new tab, Download), set level with the title.
   * Absent, the caller lays its actions over the document, and the title keeps
   * a gutter clear for them.
   */
  actions?: ReactNode;
  /** The report's pickers, on the row under the title (see `ReportHeader`). */
  pickers?: ReactNode;
}) {
  return (
    <div className="px-8 pb-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // The title row: the document's own name, with Narrate beside it. The
          // right padding reserves the gutter overlaid actions sit in, so a
          // long title never runs under them.
          h1: ({ children }) => {
            const title = (
              <>
                <h1 className="font-heading text-xl font-semibold tracking-tight">
                  {children}
                </h1>
                <NarrateButton script={narration} />
              </>
            );
            return actions ? (
              <ReportHeader title={title} actions={actions} pickers={pickers} />
            ) : (
              <div className="mb-4 flex min-h-9 flex-wrap items-center gap-3 pr-72">
                {title}
              </div>
            );
          },
          h2: ({ children }) => (
            <h2 className="font-heading mt-8 mb-2 text-sm font-semibold tracking-wide uppercase first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-sm font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="text-foreground font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-muted-foreground not-italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="text-muted-foreground mb-4 list-disc space-y-1 pl-5 text-sm">
              {children}
            </ul>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[0.85em]">
              {children}
            </code>
          ),
          // A ```chart or ```kpi fence is not code - it is a chart or the
          // headline tiles, drawn from the same definitions the PDF draws them
          // from so the two renderings are the same picture.
          pre: ({ children }) => {
            const fence = fenceOf(children);
            if (fence?.lang === CHART_FENCE) {
              const spec = parseChartSpec(fence.body);
              if (spec) return <ChartBlock spec={spec} />;
            }
            if (fence?.lang === KPI_FENCE) {
              const spec = parseKpiSpec(fence.body);
              if (spec) return <KpiCards tiles={spec.tiles} />;
            }
            return (
              <pre className="bg-muted mb-4 overflow-x-auto rounded p-3 text-xs">
                {children}
              </pre>
            );
          },
          // `border-separate` (not collapse) so the sticky header keeps its
          // bottom border instead of the border scrolling away with the body.
          table: ({ children }) => (
            <table className="w-full border-separate border-spacing-0 text-sm">
              {children}
            </table>
          ),
          th: ({ children, style }) => (
            <th
              style={style}
              // `top-14` clears the app header (h-14), which is itself sticky.
              className="bg-background border-border sticky top-14 z-20 border-b px-3 py-2 text-left align-bottom font-medium"
            >
              {children}
            </th>
          ),
          // The total row reads as a gray band, set apart from the rows it sums.
          tr: ({ children, node }) => (
            <tr
              className={
                isTotalTr(node as HastNode | undefined)
                  ? "[&>td]:bg-muted [&>td]:font-semibold"
                  : undefined
              }
            >
              {children}
            </tr>
          ),
          td: ({ children, style }) => (
            <td
              style={style}
              className="border-border/60 border-b px-3 py-1.5 align-top tabular-nums"
            >
              {children}
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
