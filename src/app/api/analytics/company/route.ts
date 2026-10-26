/**
 * The app's dashboard chart fetches /api/analytics/company for the full
 * history and the fleet decline. On the landing that route answers from the
 * fixture, through the app's own decline fit, so the card and the curve show
 * the number the real page would.
 */
import { NextResponse } from "next/server";
import { fleetDecline } from "@/lib/analytics/fleet-decline";
import { dashboardFixture, FIXTURE_TODAY } from "@/lib/screens/dashboard-fixture";

export const dynamic = "force-static";

export function GET() {
  const fx = dashboardFixture();
  const decline = fleetDecline(fx.streams, fx.prices, new Date(`${FIXTURE_TODAY}T12:00:00Z`), 60);
  return NextResponse.json({ monthly: fx.monthly, byWellMonthly: fx.byWellMonthly, decline });
}
