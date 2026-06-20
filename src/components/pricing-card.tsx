import type { PricingTier } from "@/lib/pricing";
import { formatCredits, formatUsd } from "@/lib/pricing";
import { SIGN_UP_URL } from "@/lib/links";

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const isContactSales = tier.monthlyUsd === null;

  return (
    <div className="flex h-full w-full flex-col rounded-md border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-sans text-lg font-medium tracking-tight">
        {tier.label}
      </h3>

      <p className="mt-1 text-sm text-muted">{tier.wells}</p>

      <div className="mt-5 flex items-baseline gap-1.5">
        {isContactSales ? (
          <span className="font-sans text-3xl font-medium tracking-tight">
            Custom
          </span>
        ) : (
          <>
            <span className="font-sans text-4xl font-medium tracking-tight">
              {formatUsd(tier.monthlyUsd as number)}
            </span>
            <span className="text-sm text-muted">/ month</span>
          </>
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
