"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, ArrowUp, DollarSign, Download, ShieldCheck, WifiOff, X } from "lucide-react";
import { BOOK_DEMO_URL, SIGN_UP_URL } from "@/lib/links";
import { STARTER_QUESTIONS, type StarterIcon } from "@/lib/sales-chat/starters";
import { MAX_MESSAGE_CHARS, MAX_MESSAGES_PER_SESSION } from "@/lib/sales-chat/limits";
import { cn } from "@/lib/utils";

/**
 * The website's chat. A pill-shaped input reading "Ask anything about
 * WildcatIQ" floats at the bottom centre from the moment the page loads. Typing in it or pressing its arrow opens a centred window:
 * logo header, a plain greeting, the starter questions pinned above the
 * composer, and a fine-print line. Every open is a new conversation.
 */

const BODY =
  "text-[14px] leading-relaxed [&>*+*]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_strong]:font-semibold";

const PLACEHOLDER = "Ask anything about WildcatIQ";

const STARTER_ICONS: Record<StarterIcon, typeof DollarSign> = {
  price: DollarSign,
  import: Download,
  shield: ShieldCheck,
  offline: WifiOff,
  arrow: ArrowRight,
};

function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full border border-border bg-background", className)} aria-hidden>
      <Image src="/slim_normal.png" alt="" width={903} height={859} className="h-[55%] w-[55%] object-contain" />
    </span>
  );
}

export function SalesChat() {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [bar, setBar] = useState("");
  const barRef = useRef<HTMLInputElement>(null);

  /** Open the window. With `send` the bar's text goes out as the first message; otherwise it becomes the draft. */
  const launch = (send: boolean) => {
    setSeed(send && bar.trim() ? `\u0000${bar.trim()}` : bar);
    setBar("");
    setOpen(true);
  };

  const close = useCallback(() => {
    setOpen(false);
    barRef.current?.blur();
  }, []);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          launch(true);
        }}
        className={cn(
          "fixed bottom-5 left-1/2 z-40 flex h-14 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background pl-2 pr-2 shadow-[0_8px_30px_-8px_rgb(0_0_0/0.25),0_0_0_1px_rgb(0_0_0/0.03)] transition-all duration-300",
          open ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <Logo className="size-10" />
        <input
          ref={barRef}
          value={bar}
          onChange={(e) => setBar(e.target.value)}
          onFocus={() => launch(false)}
          placeholder={PLACEHOLDER}
          aria-label={PLACEHOLDER}
          tabIndex={open ? -1 : 0}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-primary-text outline-none placeholder:text-tertiary-text"
        />
        <button
          type="submit"
          aria-label="Open chat"
          tabIndex={open ? -1 : 0}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
      {open && <ChatWindow seed={seed} onClose={close} />}
    </>
  );
}

/** A `\u0000` prefix on `seed` means "send this at once"; otherwise it is the draft to start with. */
function ChatWindow({ seed, onClose }: { seed: string; onClose: () => void }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/sales-chat",
        body: () => ({ pathname: window.location.pathname }),
      }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [draft, setDraft] = useState(seed.startsWith("\u0000") ? "" : seed);
  const windowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const userTurns = messages.filter((m) => m.role === "user").length;
  const atLimit = userTurns >= MAX_MESSAGES_PER_SESSION;

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy || atLimit) return;
      void sendMessage({ text: trimmed });
      setDraft("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    },
    [busy, atLimit, sendMessage],
  );

  // The question typed into the bar before the window existed.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the bar's question goes out once, on mount
    if (seed.startsWith("\u0000")) send(seed.slice(1));
  }, [seed, send]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // A press anywhere off the window closes it, as Escape does.
    const onPointer = (e: PointerEvent) => {
      if (!windowRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [onClose]);

  // Phones get the full screen, so the page behind must not scroll.
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      document.body.style.overflow = mql.matches ? "hidden" : "";
    };
    apply();
    mql.addEventListener("change", apply);
    return () => {
      mql.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-label="Chat"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-200 md:inset-auto md:bottom-5 md:left-1/2 md:h-[min(560px,calc(100dvh-5rem))] md:w-[min(680px,calc(100vw-2rem))] md:-translate-x-1/2 md:rounded-2xl md:border md:border-border md:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.3)] md:slide-in-from-bottom-2"
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Logo className="size-9" />
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold text-primary-text">Orion</div>
          <div className="ty-caption text-tertiary-text">Ask anything</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="ml-auto flex size-8 items-center justify-center rounded-md text-tertiary-text transition-colors hover:bg-background-subtle hover:text-primary-text"
        >
          <X className="size-4" />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <p className={cn(BODY, "text-primary-text")}>
              Hi, I&apos;m Orion. Ask me anything about WildcatIQ: pricing, setup, or how it runs your field.
            </p>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className={cn(BODY, "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-background-subtle px-3.5 py-2 text-primary-text")}>
                  {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex flex-col gap-3 text-primary-text">
                {m.parts.map((p, i) => {
                  if (p.type === "text") return <Prose key={i} text={p.text} />;
                  if (p.type === "tool-book_demo" && p.state === "output-available") return <Card key={i} title="Book a demo" href={BOOK_DEMO_URL} />;
                  if (p.type === "tool-start_signup" && p.state === "output-available") return <Card key={i} title="Get started" href={SIGN_UP_URL} />;
                  if (p.type === "tool-request_followup" && p.state === "output-available") {
                    const out = p.output as { ok: boolean; error?: string };
                    const input = p.input as { email?: string };
                    return out.ok ? (
                      <Card key={i} title="Request sent" body={`We will reach out at ${input.email}.`} />
                    ) : (
                      <Card key={i} title="Request not sent" body={`${out.error} Please book a demo instead.`} href={BOOK_DEMO_URL} label="Book a demo" />
                    );
                  }
                  return null;
                })}
              </div>
            ),
          )}

          {status === "submitted" && <div className="ty-body-2 animate-pulse text-tertiary-text">Thinking…</div>}

          {error && (
            <div className="ty-body-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
              {friendlyError(error)}{" "}
              <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Book a demo
              </a>
            </div>
          )}
        </div>
      </div>

      {messages.length === 0 && !busy && (
        <ul className="shrink-0 border-t border-border px-3 py-2">
          {STARTER_QUESTIONS.map(({ q, icon }) => {
            const Icon = STARTER_ICONS[icon];
            return (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => send(q)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[14px] text-secondary-text transition-colors hover:bg-background-subtle hover:text-primary-text"
                >
                  <Icon className="size-4 shrink-0 text-tertiary-text" aria-hidden />
                  {q}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="shrink-0 px-4 pb-2 pt-3">
        {atLimit ? (
          <div className="ty-body-2 flex h-12 items-center justify-center text-tertiary-text">
            This chat has reached its limit. Close it and open a new one to keep going.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-end gap-2 rounded-full border border-border bg-background py-1.5 pl-5 pr-1.5 focus-within:border-foreground/30"
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
              rows={1}
              maxLength={MAX_MESSAGE_CHARS}
              placeholder={PLACEHOLDER}
              aria-label={PLACEHOLDER}
              className="max-h-40 min-h-9 flex-1 resize-none self-center bg-transparent py-1.5 text-[15px] leading-6 text-primary-text outline-none placeholder:text-tertiary-text"
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              aria-label="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors disabled:bg-background-subtle disabled:text-tertiary-text"
            >
              <ArrowUp className="size-4" />
            </button>
          </form>
        )}
        <p className="ty-caption pt-2 text-center text-tertiary-text">Answers are automated and may be incomplete.</p>
      </div>
    </div>
  );
}

/** The route's own refusals are plain sentences; anything else is a network failure. */
function friendlyError(error: Error): string {
  const msg = error.message?.trim() ?? "";
  if (!msg || /fetch|network|load failed|aborted/i.test(msg)) {
    return "We could not reach the chat service. Check your connection and try again.";
  }
  return msg;
}

function Prose({ text }: { text: string }) {
  return (
    <div className={BODY}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

/** A tool result: one line and, when there is somewhere to go, one button. */
function Card({ title, body, href, label }: { title: string; body?: string; href?: string; label?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background-subtle px-3.5 py-3">
      <div className="ty-body-2 font-medium text-primary-text">{title}</div>
      {body && <p className="ty-body-2 mt-0.5 text-tertiary-text">{body}</p>}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex h-8 items-center rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          {label ?? title}
        </a>
      )}
    </div>
  );
}
