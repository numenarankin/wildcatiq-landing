"use client";

/**
 * A project page as the app renders it (`project-workspace.tsx`: the app's
 * ProjectToolbar over its Files tab), playing one log review on a loop: the
 * cursor opens Smith 4's LAS from the project's files, the app's viewer draws
 * the whole log and zooms to the zone behind pipe, the cursor opens the Orion
 * drawer from the topbar (`ai-drawer.tsx`, docked beside the page so the log
 * stays in view), Jim asks for tops and pay, Orion reads the open file whole
 * (the page context names it, `page-context.ts`), the tops and zone tables
 * stream, the porosity-feet chart draws and the recompletion call streams in.
 * Every frame is the app's own JSX; the answer is `lasReplies()`, worked on
 * the same curves the viewer draws.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectToolbar } from "@/components/projects/project-toolbar";
import { FileBrowser } from "@/components/files/file-browser";
import { DocumentViewer } from "@/components/files/document-viewer";
import { ChatPanel } from "@/components/ai/chat-panel";
import { ChatScriptContext, type ChatStatus, type UIMessage } from "@/lib/ai/sdk";
import { readPart } from "@/lib/screens/orion-fixture";
import { LAS_QUESTION, lasChart, lasReplies, smith4LogThread } from "@/lib/screens/orion-las-fixture";
import { LAS_FILE_NAME } from "@/lib/screens/mobile-b-fixture";
import {
  PROJECT_FOLDER_ID,
  PROJECT_LAS,
  PROJECT_NAME,
  PROJECT_PATH,
  PROJECT_TREE,
  recompletionWindow,
  smith4LasText,
} from "@/lib/screens/log-analysis-fixture";
import { AppFrame } from "./app-frame";
import { useDemoActive, useDemoProgress } from "./demo-active";
import { DemoCursor, centreOf, toCanvas, type CursorPoint } from "./product/recon/cursor";
import { installUnscaledMeasure } from "./unscaled-measure";

// The log viewer sizes its tracks from getBoundingClientRect.
installUnscaledMeasure();

/** `project-workspace.tsx` GUTTER: the padded tabs line up with the topbar label. */
const GUTTER = "px-[77px] md:px-[85px]";

/** The thread the Orion page shows finished; here it plays from empty. */
const THREAD = smith4LogThread();
const CONVERSATION_ID = THREAD.id;
/** The open file is in the page context, so Orion reads it without browsing for it. */
const TOOLS = ["read_las_full"] as const;
const [REPLY_1, REPLY_2] = lasReplies();

type Phase =
  | "files"
  | "aimFile"
  | "pressFile"
  | "log"
  | "zoom"
  | "aimOrion"
  | "pressOrion"
  | "empty"
  | "typing"
  | "sent"
  | "tools"
  | "stream1"
  | "chart"
  | "stream2"
  | "hold";

const HOLD: Partial<Record<Phase, number>> = {
  files: 600,
  aimFile: 900,
  pressFile: 350,
  log: 2400,
  zoom: 3400,
  aimOrion: 900,
  pressOrion: 350,
  empty: 900,
  sent: 1200,
  chart: 1600,
  hold: 5700,
};
/** The timed phases and where each goes next; typing, tools and streaming advance on their own counters. */
const NEXT: Partial<Record<Phase, Phase>> = {
  files: "aimFile",
  aimFile: "pressFile",
  pressFile: "log",
  log: "zoom",
  zoom: "aimOrion",
  aimOrion: "pressOrion",
  pressOrion: "empty",
  empty: "typing",
  sent: "tools",
  chart: "stream2",
  hold: "files",
};
const TYPE_MS = 30;
const TOOL_MS = 1100;
const STREAM_MS = 40;
const STREAM_CHUNK = 10;

const ORDER: Phase[] = [
  "files", "aimFile", "pressFile", "log", "zoom", "aimOrion", "pressOrion",
  "empty", "typing", "sent", "tools", "stream1", "chart", "stream2", "hold",
];
const reached = (phase: Phase, at: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(at);

/**
 * The LAS file's bytes, as the signed URL the app's viewer fetches. One per
 * page load and never revoked: revoking on unmount broke the viewer under
 * Strict Mode, whose rehearsal unmount revoked the URL the remount kept.
 */
let lasUrlCache: string | null = null;
function lasObjectUrl(): string {
  if (typeof window === "undefined") return "";
  lasUrlCache ??= URL.createObjectURL(new Blob([smith4LasText()], { type: "text/plain" }));
  return lasUrlCache;
}

function useScript() {
  const active = useDemoActive();
  const [phase, setPhase] = useState<Phase>("files");
  const [typed, setTyped] = useState(0);
  const [tools, setTools] = useState(0);
  const [streamed, setStreamed] = useState(0);

  useEffect(() => {
    if (!active) return;
    let id: ReturnType<typeof setTimeout>;
    const go = (to: Phase, ms: number) => {
      id = setTimeout(() => {
        setStreamed(0);
        if (to === "files") {
          setTyped(0);
          setTools(0);
        }
        setPhase(to);
      }, ms);
    };
    switch (phase) {
      case "typing":
        if (typed >= LAS_QUESTION.length) go("sent", 500);
        else id = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
        break;
      case "tools":
        if (tools >= TOOLS.length) go("stream1", 600);
        else id = setTimeout(() => setTools((n) => n + 1), TOOL_MS);
        break;
      case "stream1":
        if (streamed >= REPLY_1.length) go("chart", 400);
        else id = setTimeout(() => setStreamed((n) => n + STREAM_CHUNK), STREAM_MS);
        break;
      case "stream2":
        if (streamed >= REPLY_2.length) go("hold", 400);
        else id = setTimeout(() => setStreamed((n) => n + STREAM_CHUNK), STREAM_MS);
        break;
      default:
        go(NEXT[phase]!, HOLD[phase]!);
    }
    return () => clearTimeout(id);
  }, [active, phase, typed, tools, streamed]);

  return { phase, typed, tools, streamed };
}

export function LogAnalysisLive() {
  const { phase, typed, tools, streamed } = useScript();
  useDemoProgress(ORDER.indexOf(phase), ORDER.length);
  const root = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);
  const [lasUrl] = useState(lasObjectUrl);
  const zoom = useMemo(() => recompletionWindow(), []);

  const viewing = reached(phase, "pressFile");
  const drawerOpen = reached(phase, "pressOrion");

  useEffect(() => {
    // On the next frame, so the cursor aims at what has just painted.
    const frame = requestAnimationFrame(() => {
      const el = root.current;
      switch (phase) {
        case "files": {
          // In from the lower right, so the aim reads as a move.
          const b = el?.getBoundingClientRect();
          const c = b && toCanvas(el, b.left + b.width * 0.78, b.top + b.height * 0.86);
          setCursor(c ? { ...c, down: false } : null);
          break;
        }
        case "aimFile": {
          const name = Array.from(el?.querySelectorAll("td span") ?? []).find((s) => s.textContent?.trim().startsWith(LAS_FILE_NAME));
          const c = centreOf(name);
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "aimOrion": {
          // The topbar's Orion trigger, outside this page's root.
          const button = el?.closest("[data-screen-canvas]")?.querySelector('button[aria-label="Chat with Orion"]');
          const c = centreOf(button);
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "pressFile":
        case "pressOrion":
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "log":
          setCursor((c) => (c ? { ...c, down: false } : c));
          break;
        case "empty":
          setCursor(null);
          break;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const script = useMemo(() => {
    const messages: UIMessage[] = [];
    let status: ChatStatus = "ready";
    const now = new Date().toISOString();
    if (reached(phase, "sent")) {
      messages.push({
        id: "msg-smith4-log-u1",
        role: "user",
        metadata: { createdAt: now },
        parts: [{ type: "text", text: LAS_QUESTION, state: "done" }],
      });
    }
    if (phase === "sent") status = "submitted";
    if (reached(phase, "tools")) {
      const parts: UIMessage["parts"] = [{ type: "step-start" }];
      const toolCount = phase === "tools" ? tools : TOOLS.length;
      for (let i = 0; i < toolCount; i++) parts.push(readPart(TOOLS[i], i));
      if (phase === "tools") status = "streaming";
      if (phase === "stream1") {
        status = "streaming";
        parts.push({ type: "text", text: REPLY_1.slice(0, streamed), state: "streaming" });
      }
      if (reached(phase, "chart")) {
        parts.push({ type: "text", text: REPLY_1, state: "done" });
        parts.push({ type: "tool-render_chart", toolCallId: "toolu_chart_smith4_log", state: "output-available", input: {}, output: lasChart() });
      }
      if (phase === "chart") status = "streaming";
      if (phase === "stream2") {
        status = "streaming";
        parts.push({ type: "text", text: REPLY_2.slice(0, streamed), state: "streaming" });
      }
      if (phase === "hold") parts.push({ type: "text", text: REPLY_2, state: "done" });
      messages.push({ id: "msg-smith4-log-a1", role: "assistant", metadata: { createdAt: now }, parts });
    }
    return { messages, status };
  }, [phase, tools, streamed]);

  const noop = useCallback(() => {}, []);

  return (
    <AppFrame
      path={PROJECT_PATH}
      crumbs={["Projects", PROJECT_NAME]}
      fullBleed
      drawer={{
        open: drawerOpen,
        children: (
          <ChatScriptContext.Provider value={script}>
            <ChatPanel
              key={CONVERSATION_ID}
              conversationId={CONVERSATION_ID}
              folderId={PROJECT_FOLDER_ID}
              projectName={PROJECT_NAME}
              onClose={noop}
              scriptedInput={phase === "typing" ? LAS_QUESTION.slice(0, typed) : ""}
            />
          </ChatScriptContext.Provider>
        ),
      }}
    >
      <div ref={root} data-phase={phase} className="relative flex h-full min-h-0 flex-col">
        <ProjectToolbar
          projectName={PROJECT_NAME}
          tab="files"
          onTab={noop}
          onNewChat={noop}
          onNewTask={noop}
          onSelectFromFiles={noop}
          onUploadFromComputer={noop}
          onNewNote={noop}
          onRename={noop}
          onShare={noop}
        />

        <div className={cn("flex min-h-0 flex-1 flex-col py-4 md:py-6", GUTTER)}>
          {viewing ? (
            <div data-unscaled-measure className="flex min-h-0 flex-1 flex-col">
              <DocumentViewer
                file={PROJECT_LAS}
                name={PROJECT_LAS.name}
                url={lasUrl}
                zoom={reached(phase, "zoom") ? zoom : null}
                onBack={noop}
              />
            </div>
          ) : (
            <FileBrowser root={PROJECT_TREE} initialFolderId={PROJECT_FOLDER_ID} embedded />
          )}
        </div>

        {cursor && <DemoCursor {...cursor} />}
      </div>
    </AppFrame>
  );
}
