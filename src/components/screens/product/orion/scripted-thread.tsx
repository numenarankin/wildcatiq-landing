"use client";

/**
 * The /orion page playing one fixture thread forward on a loop, the way the
 * home hero plays its exchange: any files stage in the real composer, the
 * question types in, sends, the thinking orb runs while the reads land, then
 * the reply plays part by part (text streams, a chart draws, an approval card
 * waits and is approved). The script is derived from the thread's own parts,
 * so the loop always ends on exactly what the thread holds at rest.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrionChat } from "@/components/ai/orion-chat";
import { OrionConversationList } from "@/components/ai/orion-conversation-list";
import { ScreenPanel } from "@/components/screens/panel";
import { useDemoActive } from "@/components/screens/demo-active";
import type { Conversation } from "@/lib/ai/conversations";
import { ChatScriptContext, type ChatStatus, type UIMessage } from "@/lib/ai/sdk";
import { conversationsWith } from "@/lib/screens/orion-fixture";

type Part = UIMessage["parts"][number];
type ToolPart = Extract<Part, { toolCallId: string; type: `tool-${string}` }>;

type Step =
  | { k: "empty"; ms: number }
  | { k: "attach"; ms: number }
  | { k: "type" }
  | { k: "sent"; ms: number }
  | { k: "tools" }
  | { k: "stream"; i: number }
  | { k: "show"; i: number; ms: number }
  | { k: "approved"; ms: number }
  | { k: "end"; ms: number };

const TYPE_MS = 30;
const TOOL_MS = 1100;
const STREAM_MS = 45;
const STREAM_CHUNK = 8;
const CHART_HOLD = 1600;
const APPROVAL_HOLD = 4200;
const APPROVED_HOLD = 3800;

const isTool = (p: Part): p is ToolPart => "toolCallId" in p && p.type.startsWith("tool-");
const isChart = (p: Part) => p.type === "tool-render_chart";
const isApproval = (p: Part) => isTool(p) && p.state === "approval-requested";

/** The thread's pieces: the user's text and files, Orion's reads, and the reply's parts in order. */
function threadParts(conversation: Conversation) {
  const [user, reply] = conversation.messages;
  const said = user.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  // A knowledge-base attachment rides as a trailer on the text (orion-chat.tsx
  // `handleSend`): staged as a chip, never typed.
  const marker = said.match(/\n*\[Attached from knowledge base: ([^\]]*)\]\s*$/);
  const question = marker ? said.slice(0, marker.index).trimEnd() : said;
  const kbFiles = marker ? marker[1].split(",").map((n) => n.trim()).filter(Boolean) : [];
  const files = user.parts.flatMap((p) => (p.type === "file" ? [p.filename ?? "file"] : []));
  const body = reply.parts.filter((p) => p.type !== "step-start");
  const firstContent = body.findIndex((p) => !isTool(p) || isChart(p) || isApproval(p));
  const reads = body.slice(0, firstContent);
  const content = body.slice(firstContent);
  return { user, reply, question, files, kbFiles, reads, content };
}

/** A pending write as the SDK holds it once approved and run. */
function savedOf(p: Part): Part {
  if (!isTool(p) || !p.approval) return p;
  // A batch write answers with its per-row results, which the outcome card counts.
  const rows = (p.input as { rows?: unknown[] } | undefined)?.rows;
  const output = Array.isArray(rows)
    ? { ok: true, total: rows.length, written: rows.length, rows: rows.map(() => ({ ok: true })) }
    : { ok: true };
  return { ...p, state: "output-available", output, approval: { ...p.approval, approved: true } };
}

function stepsOf(t: ReturnType<typeof threadParts>, holdMs: number): Step[] {
  const steps: Step[] = [{ k: "empty", ms: 1800 }];
  if (t.files.length || t.kbFiles.length) steps.push({ k: "attach", ms: 1600 });
  steps.push({ k: "type" }, { k: "sent", ms: 1400 });
  if (t.reads.length) steps.push({ k: "tools" });
  t.content.forEach((p, i) => {
    if (p.type === "text") steps.push({ k: "stream", i });
    else steps.push({ k: "show", i, ms: isApproval(p) ? APPROVAL_HOLD : CHART_HOLD });
  });
  if (t.content.some(isApproval)) steps.push({ k: "approved", ms: APPROVED_HOLD });
  steps.push({ k: "end", ms: holdMs });
  return steps;
}

function useThreadScript(conversation: Conversation, holdMs: number) {
  const t = useMemo(() => threadParts(conversation), [conversation]);
  const steps = useMemo(() => stepsOf(t, holdMs), [t, holdMs]);
  const active = useDemoActive();
  const [at, setAt] = useState(0);
  const [n, setN] = useState(0);
  const step = steps[at];

  useEffect(() => {
    if (!active) return;
    let id: ReturnType<typeof setTimeout>;
    const next = (ms: number) => {
      id = setTimeout(() => {
        setN(0);
        setAt((a) => (a + 1) % steps.length);
      }, ms);
    };
    const tick = (ms: number, by: number) => {
      id = setTimeout(() => setN((x) => x + by), ms);
    };
    switch (step.k) {
      case "type":
        if (n >= t.question.length) next(500);
        else tick(TYPE_MS, 1);
        break;
      case "tools":
        if (n >= t.reads.length) next(1000);
        else tick(TOOL_MS, 1);
        break;
      case "stream": {
        const p = t.content[step.i];
        if (p.type === "text" && n < p.text.length) tick(STREAM_MS, STREAM_CHUNK);
        else next(400);
        break;
      }
      default:
        next(step.ms);
    }
    return () => clearTimeout(id);
  }, [active, step, n, t, steps.length]);

  const script = useMemo(() => {
    const kinds = steps.map((s) => s.k);
    const sentAt = kinds.indexOf("sent");
    const firstContentAt = steps.findIndex((s) => s.k === "stream" || s.k === "show");
    const messages: UIMessage[] = [];
    let status: ChatStatus = "ready";
    if (at >= sentAt && step.k !== "empty") messages.push(t.user);
    if (step.k === "sent") status = "submitted";
    if (at > sentAt && step.k !== "empty") {
      const parts: Part[] = [{ type: "step-start" }];
      const reads = step.k === "tools" ? n : t.reads.length;
      parts.push(...t.reads.slice(0, reads));
      if (step.k === "tools") status = "streaming";
      if (at >= firstContentAt) {
        const current = "i" in step ? step.i : t.content.length;
        t.content.forEach((p, i) => {
          if (i > current) return;
          if (i === current && step.k === "stream" && p.type === "text") {
            parts.push({ type: "text", text: p.text.slice(0, n), state: "streaming" });
          } else {
            parts.push(step.k === "approved" || step.k === "end" ? savedOf(p) : p);
          }
        });
        const last = t.content[current];
        if (step.k === "stream" || (step.k === "show" && last && !isApproval(last))) status = "streaming";
      }
      messages.push({ ...t.reply, parts });
    }
    return { messages, status };
  }, [steps, at, step, n, t]);

  const input = step.k === "type" ? t.question.slice(0, n) : "";
  const staged = step.k === "attach" || step.k === "type";
  const files = staged ? t.files : [];
  const kbFiles = staged ? t.kbFiles : [];
  return { script, input, files, kbFiles };
}

/** The /orion page on one thread, the rest of the history beside it, the thread playing itself. */
export function ScriptedOrionPage({
  conversation,
  holdMs = 4000,
}: {
  conversation: Conversation;
  /** How long the finished thread rests before the loop restarts; a long answer needs longer to read. */
  holdMs?: number;
}) {
  const [conversations] = useState(() => conversationsWith(conversation));
  const { script, input, files, kbFiles } = useThreadScript(conversation, holdMs);
  const live = useMemo(() => ({ ...conversation, messages: script.messages }), [conversation, script.messages]);
  const noop = useCallback(() => {}, []);
  return (
    <ScreenPanel w={1320} h={820} path="/orion" pad={false}>
      <ChatScriptContext.Provider value={script}>
        <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-background">
          <OrionConversationList
            conversations={conversations.map((c) => (c.id === conversation.id ? live : c))}
            activeId={conversation.id}
            onSelect={noop}
            onCreate={noop}
            onDelete={noop}
            onPrint={noop}
            canPrint={script.messages.length > 0}
            printing={false}
          />
          <div className="relative flex min-w-0 flex-1">
            <OrionChat
              key={conversation.id}
              conversation={live}
              onMessagesChange={noop}
              firstName="Jim"
              scriptedInput={input}
              scriptedFiles={files}
              scriptedKbFiles={kbFiles}
            />
          </div>
        </div>
      </ChatScriptContext.Provider>
    </ScreenPanel>
  );
}
