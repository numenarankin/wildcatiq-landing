"use client";

/**
 * Orion on the pumper's phone: he asks what is in Roy Corbett 4 and when it
 * was last pulled. A read, so no approval card: the reads narrate under the
 * orb (`get_well_equipment`, `get_well_service`) and the answer streams. The
 * phone's Orion chat (product/mobile/orion-chat.tsx) plays the script.
 */
import { OrionChatScreen, type PhoneOrionScript } from "@/components/screens/product/mobile/orion-chat";
import { PUMPER_QUESTION, PUMPER_READS, PUMPER_REPLY } from "@/lib/screens/orion-roles-fixture";

const SCRIPT: PhoneOrionScript = {
  question: PUMPER_QUESTION,
  reads: PUMPER_READS,
  reply: PUMPER_REPLY,
  stamp: "9:12 AM",
  time: "9:12",
};

export function PumperOrionScreen() {
  return <OrionChatScreen script={SCRIPT} />;
}
