/**
 * Landing-page pricing catalog. Display-only mirror of the WildcatIQ webapp's
 * billing tiers (see wildcat-webapp `src/lib/billing/tiers.ts`) - kept here so
 * the marketing site has no dependency on the app's server modules. Keep the
 * well bands, prices, and monthly AI-credit allotments in sync with that file.
 */

export interface PricingTier {
  label: string;
  /** Human-readable well-count band. */
  wells: string;
  /** Monthly price in USD, or null for contact-sales. */
  monthlyUsd: number | null;
  /** Free AI credits granted each billing period. */
  monthlyCredits: number;
  /** Short positioning line. */
  blurb: string;
}

export const PRICING_TIERS: readonly PricingTier[] = [
  {
    label: "Tier 1",
    wells: "1 to 49 wells",
    monthlyUsd: 500,
    monthlyCredits: 10_000,
    blurb: "For independents getting started.",
  },
  {
    label: "Tier 2",
    wells: "50 to 99 wells",
    monthlyUsd: 1_000,
    monthlyCredits: 25_000,
    blurb: "For growing operators.",
  },
  {
    label: "Tier 3",
    wells: "100 to 149 wells",
    monthlyUsd: 1_500,
    monthlyCredits: 50_000,
    blurb: "For established field operations.",
  },
  {
    label: "Tier 4",
    wells: "150 to 199 wells",
    monthlyUsd: 2_000,
    monthlyCredits: 100_000,
    blurb: "For large multi-asset operators.",
  },
  {
    label: "Tier 5",
    wells: "200+ wells",
    monthlyUsd: null,
    monthlyCredits: 250_000,
    blurb: "Enterprise scale, tailored to you.",
  },
] as const;

/** Every plan includes the full platform - these are the shared inclusions. */
export const INCLUDED_FEATURES: readonly string[] = [
  "Exploration, Production, Operations & Finance",
  "Orion AI copilot across all your data",
  "Real-time production & financial analytics",
  "Document management with OCR & search",
  "Unlimited team members & role permissions",
];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(amount: number): string {
  return usdFormatter.format(amount);
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString("en-US");
}
