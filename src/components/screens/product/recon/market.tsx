"use client";

/**
 * Recon's Market view as the app renders it (`market-view.tsx`), scoped to
 * Young County: the scope bar, the four stat tiles, the oil line through the
 * last reported cycle, and the statewide boards.
 */
import { MarketView } from "@/components/scout/market-view";
import { MARKET_SCOPE, reconMarket } from "@/lib/screens/recon-market-fixture";
import { ScreenPanel } from "../../panel";

export function ReconMarketScreen() {
  return (
    <ScreenPanel w={1200} h={900} path="/recon" pad={false}>
      <MarketView data={reconMarket} initialKind="county" initialAreas={[MARKET_SCOPE]} />
    </ScreenPanel>
  );
}
