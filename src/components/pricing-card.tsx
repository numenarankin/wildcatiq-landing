import type { PricingTier } from "@/lib/pricing";
import { formatCredits, formatUsd } from "@/lib/pricing";
import { SIGN_UP_URL } from "@/lib/links";
import { ButtonLink } from "@/components/ui/button-link";

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  // Usage-based tiers carry a "$14 per well" label: show the amount large and
  // the rest as the suffix so it sits on one line like the fixed tiers.
  const usage = tier.priceLabel?.match(/^(\S+)\s+(.*)$/);
  const priceText =
    tier.monthlyUsd !== null ? formatUsd(tier.monthlyUsd) : usage ? usage[1] : tier.priceLabel ?? "Custom";
  const suffix = tier.monthlyUsd !== null ? "/ month" : usage ? `${usage[2]} / month` : null;

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border bg-background p-6">
      <h3 className="text-lg font-medium tracking-tight">{tier.label}</h3>

      <p className="mt-1 text-sm text-muted-foreground">{tier.wells}</p>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className={`font-medium tracking-tight ${suffix ? "text-4xl" : "text-3xl"}`}>
          {priceText}
        </span>
        {suffix && <span className="whitespace-nowrap text-sm text-muted-foreground">{suffix}</span>}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{tier.blurb}</p>

      <p className="mt-4 text-sm">
        <span className="font-semibold">{formatCredits(tier.monthlyCredits)}</span>{" "}
        <span className="text-muted-foreground">Orion credits / month</span>
      </p>

      <ButtonLink href={SIGN_UP_URL} external className="mt-6">
        Get started
      </ButtonLink>
    </div>
  );
}
