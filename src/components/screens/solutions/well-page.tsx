"use client";

/**
 * The well page an owner opens on a producing well: Johnson A 3 on its
 * default Production tab. The header, the stat row and the tab bar are
 * `WellWorkspace`'s own markup and derivations (`components/wells/
 * well-workspace.tsx`: `TabButton`, `Stat`, `TABS`, the headline-rate and
 * est. revenue math); the chart and the table are the app's
 * `ProductionChart` and `ProductionTable`, ported as-is. The workspace's
 * modals, uploads and server actions stay behind: nothing here opens one.
 */
import { useMemo } from "react";
import {
  ChevronDownIcon,
  FilePlusIcon,
  FlaskConicalIcon,
  FolderSearchIcon,
  PlusIcon,
  ScanLineIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeltaPct } from "@/components/delta-pct";
import { ProductionChart } from "@/components/wells/production-chart";
import { ProductionTable } from "@/components/wells/production-table";
import { AppFrame } from "@/components/screens/app-frame";
import { currentDailyEma, decline12, monthlyRatesFromPoints } from "@/lib/wells/arps";
import { cn } from "@/lib/utils";
import { PAGE_WELL, PAGE_WELL_INFO, wellPageFixture } from "@/lib/screens/well-page-fixture";

const TABS = [
  "Production",
  "Revenue",
  "Info",
  "Downtime",
  "Service",
  "Tests",
  "Shots",
  "Pumping",
  "Invoices",
  "Comments",
  "Notes",
  "Files",
];

const rateFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Effective annual decline (fraction) to "12.3%/yr"; negative = still building. */
function formatDecline(annualDecline: number | undefined): string {
  if (annualDecline == null || !Number.isFinite(annualDecline)) return "-";
  return `${(annualDecline * 100).toFixed(1).replace("-", "−")}%/yr`;
}

function TabButton({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        "-mb-px border-b-2 px-1 pb-3 text-lg font-semibold transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, change }: { label: string; value: string; change?: number | null }) {
  return (
    <div className="flex flex-col gap-1 rounded-[0.15rem] border px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        {change !== undefined ? <DeltaPct value={change} className="text-xs" /> : null}
      </span>
    </div>
  );
}

/** The workspace's Add menu, closed; every item an owner holds the permission for. */
function AddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="lg" className="bg-black text-white hover:bg-neutral-800" />}>
        <PlusIcon />
        Add
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FlaskConicalIcon />
            Well test
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Oil</DropdownMenuItem>
            <DropdownMenuItem>Gas</DropdownMenuItem>
            <DropdownMenuItem>Saltwater</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem>Note</DropdownMenuItem>
        <DropdownMenuItem>Downtime</DropdownMenuItem>
        <DropdownMenuItem>Shot</DropdownMenuItem>
        <DropdownMenuItem>Pumping</DropdownMenuItem>
        <DropdownMenuItem>Service</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FilePlusIcon />
            File
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <FolderSearchIcon />
              Select from Files
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UploadIcon />
              Upload document
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ScanLineIcon />
              Scan document
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WellWorkspaceStatic() {
  const fx = wellPageFixture();
  const chartRows = fx.production;

  const oilMonthlyRates = useMemo(() => monthlyRatesFromPoints(chartRows, "oil"), [chartRows]);
  const gasMonthlyRates = useMemo(() => monthlyRatesFromPoints(chartRows, "gas"), [chartRows]);
  const gasDaily = useMemo(
    () => chartRows.filter((p) => p.gasProduction > 0).map((p) => ({ date: p.date, mcf: p.gasProduction })),
    [chartRows]
  );
  const oilDecline12 = decline12(oilMonthlyRates);
  const gasDecline12 = decline12(gasMonthlyRates);
  // The record's horizon sits behind the operator's own last reading, so the rates read as of that day.
  const rateAsOf = chartRows.reduce<string | null>((m, p) => (m === null || p.date > m ? p.date : m), null);
  const oilRateEma = currentDailyEma(chartRows, "oil", rateAsOf);
  const gasRateEma = currentDailyEma(chartRows, "gas", rateAsOf);
  const estMonthlyRevenue =
    (oilRateEma * fx.prices.oilPerBbl + gasRateEma * fx.prices.gasPerMcf) * (365 / 12) * fx.nri;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{PAGE_WELL.name}</h1>
            <button
              type="button"
              aria-label="Well info"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <SettingsIcon className="size-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {PAGE_WELL_INFO.zone} · {PAGE_WELL_INFO.county} County · {PAGE_WELL_INFO.perforations} ft
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddMenu />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Oil rate" value={`${rateFormatter.format(oilRateEma)} bbl/d`} change={fx.dayChange.oil} />
        <Stat label="Gas rate" value={`${rateFormatter.format(gasRateEma)} MCF/d`} change={fx.dayChange.gas} />
        <Stat label="Proj. oil decline" value={formatDecline(oilDecline12 ?? undefined)} />
        <Stat label="Proj. gas decline" value={formatDecline(gasDecline12 ?? undefined)} />
        <Stat label="Est. Monthly Net Rev." value={moneyFormatter.format(estMonthlyRevenue)} />
      </div>

      <ProductionChart
        data={chartRows}
        rawData={chartRows}
        history={fx.rrcHistory}
        economics={[]}
        gasDaily={gasDaily}
        monthlyRates={oilMonthlyRates}
        gasMonthlyRates={gasMonthlyRates}
        prices={fx.prices}
        nri={fx.nri}
        splitCommodities
      />

      <div className="flex flex-col">
        <div role="tablist" className="flex items-center gap-6 border-b">
          {TABS.map((t) => (
            <TabButton key={t} active={t === "Production"}>
              {t}
            </TabButton>
          ))}
        </div>
        <div className="pt-4">
          <div className="flex flex-col gap-4">
            <ProductionTable data={chartRows} history={fx.rrcHistoryMonths} onRowClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Johnson A 3's page as the owner opens it: the Production tab, the chart on Oil. */
export function WellPageScreen() {
  return (
    <AppFrame path={`/production/wells/${PAGE_WELL.id}`} crumbs={["Production", "Wells", PAGE_WELL.name]}>
      <WellWorkspaceStatic />
    </AppFrame>
  );
}
