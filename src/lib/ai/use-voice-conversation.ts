/**
 * landing: the app's voice loop (mic capture, transcription, ElevenLabs
 * speech) does not run here. Only the types the presentational voice
 * components read are kept, at the app's path.
 */
import type { ChartSpec } from "@/lib/ai/chart-spec";

export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";
export type VoiceTurn = {
  role: "user" | "assistant";
  text: string;
  /** Charts Orion drew this turn (from render_chart) — spoken answers are silent,
   * so a chart is shown in the turn's bubble. Not persisted across reload. */
  charts?: ChartSpec[];
};
