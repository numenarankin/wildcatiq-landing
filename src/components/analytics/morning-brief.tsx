"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * The Orion-generated morning brief that streams in at the top of the dashboard
 * on every load. Reads the route's plain text stream directly (so there's no
 * protocol ambiguity and it can never silently hang, so any failure flips to the
 * fallback heading), reveals it with the same buffered "glide" as the chat, and
 * falls back to a plain heading when the AI is unavailable (no `use_ai`
 * permission, out of credits, or a transient error).
 */

/**
 * The greeting is a HEADING, the rest is the brief.
 *
 * The first sentence is "Good afternoon, Jim." and nothing else (the prompt
 * pins that), so it is lifted out and set at heading size while the report
 * underneath keeps the reading size it had. Rendering the whole brief at one
 * size made the page open with no title at all, and setting all of it large
 * made a paragraph of numbers shout.
 *
 * Parsed rather than passed as a field: the brief arrives as one plain text
 * stream, and the greeting has to be able to appear before the sentence after it
 * exists. A brief that does not open with a greeting (an older cached one, or a
 * model that ignored the instruction) yields no heading and renders whole, which
 * is the honest fallback.
 */
function splitGreeting(text: string): { greeting: string; body: string } {
  const trimmed = text.trimStart();
  const lower = trimmed.toLowerCase();
  const opens = GREETINGS.some((g) => lower.startsWith(g));

  if (!opens) {
    // Mid-word on the greeting itself ("Good aftern"): still the heading. Left
    // as body it would render at reading size for a frame and then jump, which
    // is the one thing a heading must not do.
    const typing = trimmed.length > 0 && GREETINGS.some((g) => g.startsWith(lower));
    return typing
      ? { greeting: trimmed, body: "" }
      : { greeting: "", body: text };
  }

  const end = trimmed.search(/[.!?]/);
  if (end === -1) return { greeting: trimmed, body: "" };
  return {
    greeting: trimmed.slice(0, end + 1).trim(),
    body: trimmed.slice(end + 1).trimStart(),
  };
}

/** The openings the prompt can produce, by the viewer's local hour. */
const GREETINGS = ["good morning", "good afternoon", "good evening"];

const HEADING_CLASS = "font-heading text-2xl font-semibold tracking-tight";

const PROSE_CLASS =
  "text-base font-medium leading-relaxed text-muted-foreground [&>*+*]:mt-3 [&_strong]:font-semibold [&_strong]:text-secondary-text";

/**
 * Safety net on the rendered brief, not a design target — the prompt asks for
 * at most 60 words after the greeting, and on a day with a lot to report it
 * runs over.
 * Set well above the target so this only catches a genuine runaway, and see
 * {@link capText}: it drops the overrunning SENTENCE rather than slicing a
 * sentence (or a `**bold**` run) in half.
 */
const MAX_CHARS = 600;

/**
 * Floor on the reveal rate, characters per second. This used to be 55, which
 * meant a full-length brief spent ~9 seconds typing itself out AFTER the model
 * had already finished — the single biggest reason the brief felt slow. At 400
 * a 300-character brief lands in under a second and still reads as arriving
 * rather than popping in.
 */
const MIN_REVEAL_CPS = 400;

/**
 * Strictly strip em/en dashes the brief must never contain, a safety net over
 * the prompt rule. Leaves hyphens ("3-day") and the minus sign ("−12%") alone.
 */
function noDashes(s: string): string {
  return s.replace(/\s*[—–]\s*/g, ", ");
}

/**
 * Trim an overrunning brief to its last COMPLETE sentence. Cutting mid-sentence
 * ("...tank is called in for…") reads as a broken app, and slicing inside a
 * `**bold**` run leaves raw asterisks on screen, so drop the whole unfinished
 * sentence instead. Only if the very first sentence already overruns do we fall
 * back to a word-boundary cut with an ellipsis.
 */
export function capText(s: string): string {
  const text = s.trimEnd();
  if (text.length <= MAX_CHARS) return text;
  return lastCompleteSentence(text.slice(0, MAX_CHARS));
}

/**
 * A brief the model did not finish, trimmed to its last complete sentence.
 *
 * The route stops the model at a token cap, and on a day with three long well
 * names and their numbers in bold it can reach it mid-sentence: the dashboard
 * showed "with one more well also out of band, **" and stopped. The route
 * declines to cache such a brief, but the text is already on screen. So once
 * the stream has ENDED, a brief that does not close with a full stop is cut
 * back to the sentence that did. Not applied while streaming, when every
 * brief is mid-sentence.
 */
export function finishedText(s: string): string {
  const text = s.trimEnd();
  if (/[.!?]["”*]*$/.test(text)) return text;
  return lastCompleteSentence(text);
}

/**
 * `cut` back to its last sentence end. The greeting ("Good evening, Jim.") is
 * a sentence too, so when it is the only one that finished the body is cut at
 * a word instead, with an ellipsis: a brief reduced to its greeting has lost
 * the numbers it was for.
 */
export function lastCompleteSentence(cut: string): string {
  const greetingEnd = cut.indexOf("\n\n");
  let lastStop = -1;
  for (const m of cut.matchAll(/[.!?]["”*]*(?=\s)/g)) lastStop = m.index + m[0].length;
  if (lastStop > greetingEnd && lastStop > 0) return cut.slice(0, lastStop);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Reveals `text` at a steady rate rather than popping in chunks: a rAF loop
 * advances a character cursor, catching up when it falls behind the stream, and
 * renders live markdown of the revealed prefix. A brief served from the
 * server's cache glides in the same way: the whole text landing in one frame
 * read as a block dropped on the page, whichever path it came by.
 */
function GlideText({ text }: { text: string }) {
  const targetRef = useRef("");
  const shownRef = useRef(0);
  const [revealed, setRevealed] = useState("");

  useEffect(() => {
    targetRef.current = text;
  }, [text]);

  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    const tick = (ts: number) => {
      const target = targetRef.current;
      if (target.length > shownRef.current) {
        const backlog = target.length - shownRef.current;
        const dt = last == null ? 0 : (ts - last) / 1000;
        const charsPerSecond = Math.max(MIN_REVEAL_CPS, backlog / 0.25);
        const step = Math.max(1, Math.round(charsPerSecond * dt));
        shownRef.current = Math.min(target.length, shownRef.current + step);
        setRevealed(target.slice(0, shownRef.current));
      }
      last = ts;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { greeting, body } = splitGreeting(revealed);
  return (
    <div>
      {greeting && <h1 className={HEADING_CLASS}>{greeting}</h1>}
      {body && (
        <div className={cn(PROSE_CLASS, greeting && "mt-2")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function MorningBrief() {
  const [text, setText] = useState("");
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        console.log("[dashboard-brief] requesting");
        const res = await fetch("/api/dashboard/brief", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hour: new Date().getHours() }),
          signal: controller.signal,
        });
        console.log("[dashboard-brief] response", res.status, res.ok);
        if (!res.ok || !res.body) {
          setFailed(true);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setText(acc);
        }
        console.log("[dashboard-brief] done,", acc.length, "chars");
        setEnded(true);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("[dashboard-brief] fetch failed", err);
          setFailed(true);
        }
      }
    })();
    return () => controller.abort();
  }, []);

  // Reserve the vertical space up front so streaming text (and the skeleton)
  // never push the rest of the dashboard around as the brief fills in.
  return (
    <div className="min-h-28 max-w-5xl py-4">
      {failed ? (
        <h1 className={HEADING_CLASS}>Dashboard</h1>
      ) : text ? (
        <GlideText text={capText(noDashes(ended ? finishedText(text) : text))} />
      ) : (
        <div className="flex flex-col gap-2.5" aria-hidden>
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
        </div>
      )}
    </div>
  );
}

/**
 * Landing-page variant: the same layout and glide, fed a fixed brief instead
 * of the streamed one.
 */
export function MorningBriefStatic({ text }: { text: string }) {
  return (
    <div className="min-h-28 max-w-5xl py-4">
      <GlideText text={capText(noDashes(finishedText(text)))} />
    </div>
  );
}

/**
 * landing: the brief as the page renders it while the route streams, fed by a
 * demo instead of the fetch. `text` is what has arrived so far (empty: the
 * skeleton the page holds while it waits), `ended` once the stream is done.
 */
export function MorningBriefScripted({ text, ended }: { text: string; ended: boolean }) {
  return (
    <div className="min-h-28 max-w-5xl py-4">
      {text ? (
        <GlideText text={capText(noDashes(ended ? finishedText(text) : text))} />
      ) : (
        <div className="flex flex-col gap-2.5" aria-hidden>
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
        </div>
      )}
    </div>
  );
}
