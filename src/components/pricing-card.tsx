import type { PricingTier } from "@/lib/pricing";
import { formatCredits, formatUsd } from "@/lib/pricing";
import { SIGN_UP_URL } from "@/lib/links";

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const isContactSales = tier.monthlyUsd === null;
  const priceText =
    tier.monthlyUsd !== null
      ? formatUsd(tier.monthlyUsd)
      : tier.priceLabel ?? "Custom";
  const showMonthSuffix = tier.monthlyUsd !== null || tier.priceLabel != null;

  return (
    <div className="flex h-full w-full flex-col rounded-md border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-sans text-lg font-medium tracking-tight">
        {tier.label}
      </h3>

      <p className="mt-1 text-sm text-muted">{tier.wells}</p>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span
          className={`font-sans font-medium tracking-tight ${
            showMonthSuffix ? "text-4xl" : "text-3xl"
          }`}
        >
          {priceText}
        </span>
        {showMonthSuffix && (
          <span className="text-sm text-muted">/ month</span>
        )}
      </div>

      <p className="mt-4 text-sm text-muted">{tier.blurb}</p>

      <p className="mt-4 text-sm">
        <span className="font-semibold text-foreground">
          {formatCredits(tier.monthlyCredits)}
        </span>{" "}
        <span className="text-muted">free AI credits / month</span>
      </p>

      <a
        href={isContactSales ? "#" : SIGN_UP_URL}
        className="mt-6 inline-flex items-center justify-center rounded-sm border border-white/15 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
      >
        {isContactSales ? "Contact sales" : "Get started"}
      </a>
    </div>
  );
}
