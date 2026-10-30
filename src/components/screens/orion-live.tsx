"use client";

/**
 * The Orion page as the app renders it (the app's OrionConversationList and
 * OrionChat), playing one exchange forward on a loop: Jim types the question
 * into the real composer, sends it, the thinking orb runs while Orion's reads
 * land one by one (permits, operator, offset wells, completion, production,
 * decline), the reply streams, the chart draws inline, the rest streams, the
 * task-approval card appears, Jim approves, the saved card lands. Every frame
 * is the app's own JSX on the AI SDK message shapes.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrionChat } from "@/components/ai/orion-chat";
import { OrionConversationList } from "@/components/ai/orion-conversation-list";
import { ChatScriptContext, type ChatStatus, type UIMessage } from "@/lib/ai/sdk";
import {
  ACTIVE_CONVERSATION_ID,
  PERMIT_QUESTION,
  PERMIT_REPLY_1,
  PERMIT_REPLY_2,
  PERMIT_TOOLS,
  chartPart,
  orionConversations,
  permitTaskPart,
  readPart,
} from "@/lib/screens/orion-fixture";
import { AppFrame } from "./app-frame";
import { useDemoActive, useDemoProgress } from "./demo-active";

type Phase =
  | "empty"
  | "typing"
  | "sent"
  | "tools"
  | "stream1"
  | "chart"
  | "stream2"
  | "approval"
  | "approved"
  | "hold";

/** The script in order, for the GTM progress report. */
const ORDER: Phase[] = ["empty", "typing", "sent", "tools", "stream1", "chart", "stream2", "approval", "approved", "hold"];

const HOLD: Partial<Record<Phase, number>> = {
  empty: 500,
  sent: 1400,
  chart: 1600,
  approval: 3400,
  approved: 3800,
  hold: 2700,
};
const TYPE_MS = 30;
const TOOL_MS = 1100;
const STREAM_MS = 45;
const STREAM_CHUNK = 8;

function useScript() {
  const active = useDemoActive();
  const [phase, setPhase] = useState<Phase>("empty");
  const [typed, setTyped] = useState(0);
  const [tools, setTools] = useState(0);
  const [streamed, setStreamed] = useState(0);

  useEffect(() => {
    if (!active) return;
    let id: ReturnType<typeof setTimeout>;
    const go = (to: Phase, ms: number) => {
      id = setTimeout(() => {
        setStreamed(0);
        if (to === "empty") {
          setTyped(0);
          setTools(0);
        }
        setPhase(to);
      }, ms);
    };
    switch (phase) {
      case "typing":
        if (typed >= PERMIT_QUESTION.length) go("sent", 500);
        else id = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
        break;
      case "tools":
        if (tools >= PERMIT_TOOLS.length) go("stream1", 600);
        else id = setTimeout(() => setTools((n) => n + 1), TOOL_MS);
        break;
      case "stream1":
        if (streamed >= PERMIT_REPLY_1.length) go("chart", 400);
        else id = setTimeout(() => setStreamed((n) => n + STREAM_CHUNK), STREAM_MS);
        break;
      case "stream2":
        if (streamed >= PERMIT_REPLY_2.length) go("approval", 400);
        else id = setTimeout(() => setStreamed((n) => n + STREAM_CHUNK), STREAM_MS);
        break;
      case "empty":
        go("typing", HOLD.empty!);
        break;
      case "sent":
        go("tools", HOLD.sent!);
        break;
      case "chart":
        go("stream2", HOLD.chart!);
        break;
      case "approval":
        go("approved", HOLD.approval!);
        break;
      case "approved":
        go("hold", HOLD.approved!);
        break;
      case "hold":
        go("empty", HOLD.hold!);
        break;
    }
    return () => clearTimeout(id);
  }, [active, phase, typed, tools, streamed]);

  return { phase, typed, tools, streamed };
}

const after = (phase: Phase, ...earlier: Phase[]) => !earlier.includes(phase);

export function OrionLive() {
  const [conversations] = useState(orionConversations);
  const [activeId, setActiveId] = useState<string | null>(ACTIVE_CONVERSATION_ID);
  const { phase, typed, tools, streamed } = useScript();
  useDemoProgress(ORDER.indexOf(phase), ORDER.length);

  const script = useMemo(() => {
    const messages: UIMessage[] = [];
    let status: ChatStatus = "ready";
    const now = new Date().toISOString();
    if (after(phase, "empty", "typing")) {
      messages.push({
        id: "msg-permit-u1",
        role: "user",
        metadata: { createdAt: now },
        parts: [{ type: "text", text: PERMIT_QUESTION, state: "done" }],
      });
    }
    if (phase === "sent") status = "submitted";
    if (after(phase, "empty", "typing", "sent")) {
      const parts: UIMessage["parts"] = [{ type: "step-start" }];
      const toolCount = phase === "tools" ? tools : PERMIT_TOOLS.length;
      for (let i = 0; i < toolCount; i++) parts.push(readPart(PERMIT_TOOLS[i], i));
      if (phase === "tools") status = "streaming";
      if (phase === "stream1") {
        status = "streaming";
        parts.push({ type: "text", text: PERMIT_REPLY_1.slice(0, streamed), state: "streaming" });
      }
      if (after(phase, "empty", "typing", "sent", "tools", "stream1")) {
        parts.push({ type: "text", text: PERMIT_REPLY_1, state: "done" });
        parts.push(chartPart());
      }
      if (phase === "chart") status = "streaming";
      if (phase === "stream2") {
        status = "streaming";
        parts.push({ type: "text", text: PERMIT_REPLY_2.slice(0, streamed), state: "streaming" });
      }
      if (phase === "approval" || phase === "approved" || phase === "hold") {
        parts.push({ type: "text", text: PERMIT_REPLY_2, state: "done" });
        parts.push(permitTaskPart(phase === "approval" ? "pending" : "saved"));
      }
      messages.push({ id: "msg-permit-a1", role: "assistant", metadata: { createdAt: now }, parts });
    }
    return { messages, status };
  }, [phase, tools, streamed]);

  const scriptedInput = phase === "typing" ? PERMIT_QUESTION.slice(0, typed) : "";

  const base = conversations.find((c) => c.id === activeId) ?? null;
  const active = base && base.id === ACTIVE_CONVERSATION_ID ? { ...base, messages: script.messages } : base;
  const noop = useCallback(() => {}, []);
  const onMessagesChange = useCallback((messages: UIMessage[]) => {
    void messages;
  }, []);

  return (
    <AppFrame path="/orion" crumbs={["Orion"]} fullBleed>
      <ChatScriptContext.Provider value={activeId === ACTIVE_CONVERSATION_ID ? script : null}>
        <div className="relative flex min-h-0 flex-1 overflow-hidden bg-background">
          <OrionConversationList
            conversations={conversations.map((c) => (c.id === ACTIVE_CONVERSATION_ID && active ? active : c))}
            activeId={activeId}
            onSelect={setActiveId}
            onCreate={noop}
            onDelete={noop}
            onPrint={noop}
            canPrint={(active?.messages.length ?? 0) > 0}
            printing={false}
          />
          <div className="relative flex min-w-0 flex-1">
            {active && (
              <OrionChat
                key={active.id}
                conversation={active}
                onMessagesChange={onMessagesChange}
                firstName="Jim"
                scriptedInput={activeId === ACTIVE_CONVERSATION_ID ? scriptedInput : undefined}
              />
            )}
          </div>
        </div>
      </ChatScriptContext.Provider>
    </AppFrame>
  );
}
