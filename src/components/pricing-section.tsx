"use client";

import { useRef } from "react";
import { PricingCard } from "@/components/pricing-card";
import { PRICING_TIERS } from "@/lib/pricing";
import { ArrowIcon } from "@/components/icons";

/** Home-page pricing block. Horizontal carousel of tier cards. */
export function PricingSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll by ~80% of the visible width so a fresh card or two comes into view.
    el.scrollBy({ left: el.clientWidth * 0.8 * direction, behavior: "smooth" });
  };

  return (
    <section id="pricing" className="relative">
      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h2 className="font-sans text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
              Pricing that scales with your wells
            </h2>
            <p className="mt-5 text-lg text-muted">
              Every plan includes the entire platform across Exploration,
              Production, Operations, and Finance, plus a monthly allotment of AI
              credits. Pick the band that matches your well count.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              aria-label="Previous plans"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-foreground transition-colors hover:bg-white/5"
            >
              <ArrowIcon className="h-4 w-4 rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              aria-label="Next plans"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-foreground transition-colors hover:bg-white/5"
            >
              <ArrowIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="-mx-6 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 pb-2 [scrollbar-width:none] lg:-mx-10 lg:scroll-px-10 lg:px-10 [&::-webkit-scrollbar]:hidden"
        >
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.label}
              className="w-[20rem] shrink-0 snap-start sm:w-[22rem]"
            >
              <PricingCard tier={tier} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
