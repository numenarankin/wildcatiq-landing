"use client";

import { createContext, useContext } from "react";
import { Loader2Icon, SquareIcon, Volume2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarration } from "@/components/ai/use-narration";

/**
 * landing: a demo's stand-in for the voice route, which the landing does not
 * serve. Provided, the button runs on it (its own play and stop, its own
 * loading and playing states) instead of synthesizing audio. Unset, the app's
 * narration.
 */
export const NarrationStandInContext = createContext<ReturnType<typeof useNarration> | null>(null);

/**
 * Have Orion read the report aloud, in his own voice, the way an analyst would
 * brief someone: prose as written, charts as conclusions, tables as framed
 * figures (the script is built by `narrateMarkdown`).
 *
 * Sits beside the document's title because that is where you decide whether to
 * read this or be told it. Clicking again stops him mid-sentence.
 */
export function NarrateButton({ script }: { script: string }) {
  const live = useNarration();
  const { state, error, play, stop } = useContext(NarrationStandInContext) ?? live;
  const busy = state !== "idle";

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={busy ? "Stop narration" : "Narrate this report"}
      title={error ?? "Have Orion read this report aloud"}
      onClick={() => (busy ? stop() : play(script))}
    >
      {state === "loading" ? (
        <Loader2Icon className="animate-spin" />
      ) : state === "playing" ? (
        <SquareIcon />
      ) : (
        <Volume2Icon />
      )}
      {state === "playing" ? "Stop" : "Narrate"}
    </Button>
  );
}
