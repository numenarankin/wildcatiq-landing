"use client";

/**
 * Orion for the owner: the /orion page playing one question about money
 * across leases (`ownerLeaseThread`, orion-roles-fixture.ts), the reads, a
 * per-barrel bar chart and the reasons behind the gap.
 */
import { useState } from "react";
import { ScriptedOrionPage } from "@/components/screens/product/orion/scripted-thread";
import { ownerLeaseThread } from "@/lib/screens/orion-roles-fixture";

export function OrionOwnerScreen() {
  const [conversation] = useState(ownerLeaseThread);
  return <ScriptedOrionPage conversation={conversation} holdMs={8000} />;
}
