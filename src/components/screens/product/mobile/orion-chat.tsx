"use client";

/**
 * Orion on the phone, played forward on a loop the way the web's /orion demo
 * plays: the owner types a question into the composer, sends, the orb thinks
 * while the reads land, and the answer streams in as layers, a paragraph, a
 * table and a closing line. Transcribed from mobile-background:
 * - src/components/ai/orion-chat.tsx (the landing greeting; the thread column
 *   16 padding, 24 top, 24 gap; the user bubble; the assistant block's stamp
 *   and copy / read-aloud row once the turn settles; the footer that shows the
 *   ThinkingIndicator while the turn is busy and its latest part is not text;
 *   the composer docked `DOCK_PAD_BOTTOM + max(insets.bottom, keyboard)` above
 *   the glass, focused on a blank chat and dismissed on send)
 * - src/components/ai/thinking-indicator.tsx (48px orb at weight 1.55 beside a
 *   shimmering "Thinking…", one plain-English line per tool fading in, 260 ms)
 * - src/components/ui/text-shimmer.tsx (2 s sweep, band 0.35 of the word,
 *   tertiaryText to foreground)
 * - src/components/ai/turn-layers.tsx (each layer rises 6 px over 240 ms, 45 ms
 *   apart; the " |" caret blinking at 520 ms on the live tail; tool steps
 *   hidden; a table layer: bordered, a bgSubtle microLabel header, 13pt cells,
 *   numbers right-aligned)
 * - src/lib/ai/tool-activity.ts (the activity line for each read)
 * - src/components/ai/chat-composer.tsx (the pill: 40px ghost +, 16/22 draft,
 *   32px send, disabled while blank or busy)
 * - app/(app)/orion.tsx (the header corner claimed as "Chat history")
 *
 * The default script asks how Smith 4 did this week; every figure is off the
 * dashboard fixture's daily series and the note is the pumper's comment on
 * the well (mobile-b-fixture.ts SMITH4_COMMENTS).
 */
import { ArrowUp, ChevronLeft, Copy, Plus, Volume2 } from "lucide-react";
import Image from "next/image";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { WeightedOrb } from "@/components/ai/weighted-orb";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
import { SMITH4_COMMENTS } from "@/lib/screens/mobile-b-fixture";
import { OPERATOR } from "@/lib/screens/operator";
import { C, CONTENT_TOP, HEADER_H, MICRO_LABEL, PhoneFrame, STATUS_BAR_H } from "./phone";
import { BlinkCaret, FADE_KEYFRAMES, IosKeyboard, KEYBOARD_EASE, KEYBOARD_H, KEYBOARD_MS, fadeInDown, useStepLoop, useTicker } from "./motion";

/** One exchange the phone plays: a question, the reads, and the answer's layers. */
export interface PhoneOrionScript {
  question: string;
  /** tool-activity.ts lines for the reads, in order. */
  reads: string[];
  reply: string;
  /** A table layer under the reply. */
  table?: { header: string[]; rows: string[][] };
  /** A closing paragraph under the table. */
  after?: string;
  /** Who is asking, for the greeting. */
  firstName?: string;
  /** lib/format.ts `messageTime` for a same-day message. */
  stamp: string;
  /** The status bar clock. */
  time: string;
}

/** The default: the owner asks how Smith 4 did this week. */
const SMITH4_SCRIPT: PhoneOrionScript = (() => {
  const daily = dashboardFixture().dailyByWell.find((d) => d.wellId === "w-s4")!.daily;
  const week = daily.slice(-7);
  const prior = daily.slice(-14, -7);
  const avg = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
  const oil = avg(week.map((d) => d.oilBbl));
  const gas = avg(week.map((d) => d.gasMcf));
  const move = ((oil - avg(prior.map((d) => d.oilBbl))) / avg(prior.map((d) => d.oilBbl))) * 100;
  const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const note = SMITH4_COMMENTS.find((c) => c.id === "c2")!;
  const noteAt = new Date(note.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return {
    question: "How did Smith 4 do this week?",
    reads: ["Finding what you mean", "Pulling production numbers", "Reading notes on a well"],
    reply: `Smith 4 averaged ${oil.toFixed(1)} bbl/d of oil and ${gas.toFixed(1)} mcf/d of gas over the last 7 days, ${move < 0 ? "down" : "up"} ${Math.abs(move).toFixed(1)}% on oil from the week before.`,
    table: { header: ["Day", "Oil bbl", "Gas mcf"], rows: week.map((d) => [day(d.date), d.oilBbl.toFixed(1), d.gasMcf.toFixed(1)]) },
    after: `${note.author.split(" ")[0]} noted it pumping off at ${noteAt} this morning and cut the timer by 2 hours.`,
    firstName: OPERATOR.ownerFirst,
    stamp: "7:41 AM",
    time: "7:41",
  };
})();

// The loop's beats. Typing and streaming run on their own tickers inside their step.
const TYPE_MS = 42;
const STREAM_MS = 45;
const STREAM_CHUNK = 6;

type Phase = "blank" | "typing" | "sent" | "reads" | "reply" | "table" | "after" | "settled";

const streamMs = (text: string) => Math.ceil(text.length / STREAM_CHUNK) * STREAM_MS + 300;

function phasesOf(s: PhoneOrionScript): { k: Phase; ms: number }[] {
  const out: { k: Phase; ms: number }[] = [
    { k: "blank", ms: 1600 }, // blank chat, keyboard up, greeting
    { k: "typing", ms: s.question.length * TYPE_MS + 500 },
    { k: "sent", ms: 1300 }, // keyboard drops, the orb thinks
    { k: "reads", ms: s.reads.length * 950 + 500 }, // reads land one by one
    { k: "reply", ms: streamMs(s.reply) },
  ];
  if (s.table) out.push({ k: "table", ms: 900 });
  if (s.after) out.push({ k: "after", ms: streamMs(s.after) });
  out.push({ k: "settled", ms: 6500 });
  return out;
}

/** What the docked composer covers at the bottom of the screen with the keyboard down: 42 off the glass plus the 58 pill. */
const DOCK_CLEAR = 8 + 34 + 58;

/**
 * The thread column pinned to its end, as the app's inverted list keeps the
 * latest turn in view: once the turn outgrows the screen, the column slides
 * up by the overflow, under the header.
 */
function FollowEnd({ bottom, children }: { bottom: number; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const measure = () => setShift(Math.max(0, i.offsetHeight - b.clientHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(i);
    ro.observe(b);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom, overflow: "hidden" }}>
      <div ref={inner} style={{ transform: `translateY(${-shift}px)`, transition: "transform 240ms ease" }}>
        {children}
      </div>
    </div>
  );
}

/** text-shimmer.tsx: a band 0.35 of the word wide crossing it in 2 s, linear. */
function Shimmer({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: 15,
        lineHeight: "24px",
        color: "transparent",
        backgroundColor: C.tertiaryText,
        backgroundImage: `linear-gradient(90deg, ${C.tertiaryText}, ${C.foreground}, ${C.tertiaryText})`,
        backgroundSize: "70% 100%",
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        animation: "wc-shimmer 2000ms linear infinite",
      }}
    >
      {children}
    </span>
  );
}

function Thinking({ activities }: { activities: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ height: 48, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, flexShrink: 0 }}>
          <WeightedOrb state="solving" size={64} displaySize={48} weight={1.55} ariaLabel="Orion is thinking" />
        </div>
        <Shimmer>Thinking…</Shimmer>
      </div>
      {activities.length > 0 ? (
        <div style={{ paddingLeft: 60, display: "flex", flexDirection: "column", gap: 2 }}>
          {activities.map((a) => (
            <span key={a} style={{ fontSize: 13, lineHeight: "20px", color: C.tertiaryText, ...fadeInDown(260) }}>
              {a}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** turn-layers.tsx `table` layer (COMFORTABLE: cells 13, header microLabel). */
function TableLayer({ table }: { table: NonNullable<PhoneOrionScript["table"]> }) {
  const cellRow: React.CSSProperties = { display: "flex", gap: 8, padding: "8px 10px" };
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 2.4, overflow: "hidden" }}>
      <div style={{ ...cellRow, background: C.bgSubtle }}>
        {table.header.map((h, i) => (
          <span key={h} style={{ ...MICRO_LABEL, flex: 1, textAlign: i > 0 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</span>
        ))}
      </div>
      {table.rows.map((r, ri) => (
        <div key={ri} style={{ ...cellRow, borderTop: `0.5px solid ${C.border}` }}>
          {r.map((c, i) => (
            <span key={i} style={{ flex: 1, fontSize: 13, textAlign: i > 0 ? "right" : "left", fontVariantNumeric: i > 0 ? "tabular-nums" : undefined, whiteSpace: "nowrap" }}>{c}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The phone's Orion playing `script` forward on a loop; Smith 4's week by default. */
export function OrionChatScreen({ script = SMITH4_SCRIPT }: { script?: PhoneOrionScript } = {}) {
  const { question: QUESTION, reply: REPLY, reads: READS, stamp: STAMP, table } = script;
  const AFTER = script.after ?? "";
  const FIRST_NAME = script.firstName ?? OPERATOR.pumper.split(" ")[0];
  const phases = useMemo(() => phasesOf(script), [script]);
  const durations = useMemo(() => phases.map((p) => p.ms), [phases]);
  const step = useStepLoop(durations);
  const phase = phases[step]?.k ?? "blank";
  const past = (k: Phase) => step > phases.findIndex((p) => p.k === k);
  const typed = useTicker(phase === "typing", QUESTION.length, TYPE_MS);
  const replyN = useTicker(phase === "reply", REPLY.length, STREAM_MS, STREAM_CHUNK);
  const afterN = useTicker(phase === "after", AFTER.length, STREAM_MS, STREAM_CHUNK);
  const reads = useTicker(phase === "reads", READS.length, 950);

  const landing = phase === "blank" || phase === "typing";
  const keyboard = landing;
  const draft = phase === "typing" ? QUESTION.slice(0, typed) : "";
  const busy = !landing && phase !== "settled";
  const replyText = phase === "reply" ? REPLY.slice(0, replyN) : past("reply") ? REPLY : "";
  const tableShown = table != null && (phase === "table" || past("table"));
  const afterText = phase === "after" ? AFTER.slice(0, afterN) : script.after && past("after") ? AFTER : "";
  // The footer narrates whenever the turn is busy and its latest part is not
  // text. A table is markdown inside the text part, so it counts as text.
  const textLatest = (phase === "reply" && replyN > 0) || phase === "table" || phase === "after";
  const activities = phase === "sent" ? [] : phase === "reads" ? READS.slice(0, reads) : READS;
  const showThinking = busy && !textLatest;

  const dockBottom = 8 + (keyboard ? KEYBOARD_H : 34);
  const stamp: React.CSSProperties = { fontSize: 11, lineHeight: "16px", color: C.tertiaryText, fontVariantNumeric: "tabular-nums" };
  const layer = (delay = 0) => fadeInDown(240, delay, 6);

  return (
    <PhoneFrame time={script.time}>
      <style>{`${FADE_KEYFRAMES} @keyframes wc-shimmer { from { background-position: -233.33% 0; } to { background-position: 333.33% 0; } }`}</style>
      {/* app-header.tsx, the corner claimed: caret plus "Chat history" */}
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10, height: HEADER_H, display: "flex", alignItems: "center", padding: "0 16px", background: C.background }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 4 }}>
          <ChevronLeft size={26} color={C.foreground} />
          <span style={{ fontWeight: 500, fontSize: 16 }}>Chat history</span>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Image src="/slim_normal.png" alt="" width={20} height={20} />
        </div>
        <div style={{ marginLeft: "auto", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={C.foreground} aria-hidden>
            {[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
          </svg>
        </div>
      </div>

      {landing ? (
        /* The landing: the greeting centred in the box the composer leaves with the keyboard up. */
        <div style={{ position: "absolute", top: CONTENT_TOP - STATUS_BAR_H, left: 16, right: 16, bottom: 8 + KEYBOARD_H + 58, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontWeight: 500, fontSize: 26, lineHeight: "32px", letterSpacing: -0.5, textAlign: "center", ...fadeInDown(400) }}>{`Good morning, ${FIRST_NAME}`}</span>
        </div>
      ) : (
        <FollowEnd bottom={DOCK_CLEAR}>
        <div style={{ padding: `${CONTENT_TOP - STATUS_BAR_H + 24}px 16px 24px`, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: "85%", gap: 4 }}>
            <div style={{ borderRadius: 16, background: C.bgSubtle, padding: "8px 14px" }}>
              <span style={{ fontSize: 15, lineHeight: "24px" }}>{QUESTION}</span>
            </div>
            <span style={stamp}>{STAMP}</span>
          </div>

          {/* The assistant block: TurnLayers (tool steps filtered out), then the stamp and actions once it settles */}
          {/* The assistant turn exists from its first part on: while only "sent", the
              list holds the user's turn alone and the footer sits 24 under it. */}
          {phase !== "sent" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {replyText ? (
                <span style={{ fontSize: 15, lineHeight: "24px", whiteSpace: "pre-line", ...layer() }}>
                  {replyText}
                  {phase === "reply" ? <BlinkCaret /> : null}
                </span>
              ) : null}
              {tableShown && table ? (
                <div style={layer(45)}>
                  <TableLayer table={table} />
                </div>
              ) : null}
              {afterText ? (
                <span style={{ fontSize: 15, lineHeight: "24px", ...layer() }}>
                  {afterText}
                  {phase === "after" ? <BlinkCaret /> : null}
                </span>
              ) : null}
            </div>
            {phase === "settled" ? (
              <>
                <span style={stamp}>{STAMP}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: -9 }}>
                  {[Copy, Volume2].map((Icon, i) => (
                    <div key={i} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={14} color={C.tertiaryText} />
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          ) : null}

          {showThinking ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Thinking activities={activities} />
            </div>
          ) : null}
        </div>
        </FollowEnd>
      )}

      {/* The docked composer */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: dockBottom,
          padding: "10px 16px 0",
          zIndex: 30,
          transition: `bottom ${KEYBOARD_MS}ms ${KEYBOARD_EASE}`,
          ...fadeInDown(400, 80),
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, borderRadius: 24, background: C.background, boxShadow: "0 0 20px rgba(0,0,0,0.16)", padding: "4px 10px 4px 4px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Plus size={22} color={C.foreground} />
          </div>
          <span style={{ flex: 1, minWidth: 0, alignSelf: "center", margin: "9px 0", padding: "0 8px", fontSize: 16, lineHeight: "22px", color: draft ? C.foreground : C.tertiaryText }}>
            {draft || (landing ? "How can I help you today?" : "Ask Orion…")}
            {keyboard ? <span style={{ display: "inline-block", width: 2, height: 20, marginLeft: draft ? 1 : -1, verticalAlign: "-4px", background: C.foreground, animation: "wc-cursor 1s steps(1, end) infinite" }} /> : null}
          </span>
          <div style={{ width: 32, height: 32, marginBottom: 4, borderRadius: 999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: draft && !busy ? 1 : 0.5 }}>
            <ArrowUp size={18} color={C.primaryFg} />
          </div>
        </div>
      </div>
      <style>{"@keyframes wc-cursor { 0% { opacity: 1; } 50% { opacity: 0; } }"}</style>
      <IosKeyboard up={keyboard} pressKey={phase === "typing" && typed > 0 ? QUESTION[typed - 1]?.toLowerCase() : undefined} />
    </PhoneFrame>
  );
}
