"use client";

/**
 * A page with the Orion drawer docked beside it, the way the app shell lays
 * them out (`app-shell.tsx`: the drawer is a flex sibling of the inset, so it
 * narrows the whole page, topbar included). Plays one conversation on a loop:
 * the drawer slides open on the page, the question types into the real
 * `ChatPanel`, the reads land and the reply streams (`useThreadScript`). The
 * sidebar sits collapsed to its icons, as it would beside an open drawer, so
 * the page keeps its width.
 */
import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ai/chat-panel";
import type { Conversation } from "@/lib/ai/conversations";
import { ChatScriptContext } from "@/lib/ai/sdk";
import { AppFrame } from "@/components/screens/app-frame";
import { useThreadScript } from "./scripted-thread";

/**
 * The canvas is wider than the usual 1600 so the page beside the 384 px drawer
 * keeps the width the dashboard's cards need on one line.
 */
const CANVAS_W = 1840;

/** How long the page shows on its own before the drawer opens, each loop. */
const OPEN_AFTER_MS = 700;

export function OrionDrawerScreen({
  path,
  crumbs,
  conversation,
  pagePad = false,
  holdMs = 6000,
  onPhase,
  gated = false,
  onSettled,
  children,
}: {
  path: string;
  crumbs: string[];
  conversation: Conversation;
  /** The app's main-column padding around the page. */
  pagePad?: boolean;
  /** How long the finished answer rests before the loop restarts. */
  holdMs?: number;
  /** The playback step, for a page that acts on the answer (the Recon map moving when Orion moves it). */
  onPhase?: (phase: string) => void;
  /** Each approval waits for the one before it (`useThreadScript`'s `gated`). */
  gated?: boolean;
  /** How many of the thread's writes have been approved, for a page that shows them land. */
  onSettled?: (settled: number) => void;
  children: React.ReactNode;
}) {
  const { script, input, phase, settled } = useThreadScript(conversation, holdMs, gated);

  useEffect(() => {
    onPhase?.(phase);
  }, [phase, onPhase]);

  useEffect(() => {
    onSettled?.(settled);
  }, [settled, onSettled]);
  const [open, setOpen] = useState(false);

  // Each loop starts with the drawer shut, then slides it open on the page.
  useEffect(() => {
    if (phase !== "empty") return;
    const close = setTimeout(() => setOpen(false), 0);
    const reopen = setTimeout(() => setOpen(true), OPEN_AFTER_MS);
    return () => {
      clearTimeout(close);
      clearTimeout(reopen);
    };
  }, [phase]);

  return (
    <AppFrame
      path={path}
      crumbs={crumbs}
      fullBleed={!pagePad}
      sidebarCollapsed
      width={CANVAS_W}
      drawer={{
        open,
        children: (
          <ChatScriptContext.Provider value={script}>
            <ChatPanel key={conversation.id} conversationId={conversation.id} onClose={() => {}} scriptedInput={input} />
          </ChatScriptContext.Provider>
        ),
      }}
    >
      {children}
    </AppFrame>
  );
}
