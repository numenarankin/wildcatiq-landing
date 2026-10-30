"use client";

/**
 * Orion for the office manager: the /orion page playing one question about
 * the purchaser's September statement against the run tickets
 * (`officeStatementThread`, orion-roles-fixture.ts).
 */
import { useState } from "react";
import { ScriptedOrionPage } from "@/components/screens/product/orion/scripted-thread";
import { officeStatementThread } from "@/lib/screens/orion-roles-fixture";

export function OrionOfficeScreen() {
  const [conversation] = useState(officeStatementThread);
  return <ScriptedOrionPage conversation={conversation} holdMs={9000} />;
}
