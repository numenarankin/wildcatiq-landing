import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { BOOK_DEMO_URL, SIGN_UP_URL } from "@/lib/links";
import { buildSalesInstructions, describePage } from "@/lib/sales-chat/knowledge";
import { sendFollowupLead } from "@/lib/sales-chat/followup";
import { DOC_SECTION_LIST, hasSection, readDoc, searchDocs } from "@/lib/sales-chat/docs";
import {
  MAX_MESSAGE_CHARS,
  MAX_MESSAGES_PER_SESSION,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/sales-chat/limits";

/**
 * The website's sales chat. Anonymous and public, so every input is bounded:
 * message count and length per conversation, requests per IP, output tokens
 * per reply, tool steps per turn. The model answers only from the site's own
 * catalogs (see knowledge.ts) and never writes anywhere; the one side effect
 * is an email when the visitor asks to be contacted.
 */

export const maxDuration = 60;

/** Same model as Orion in the product, at low effort: a sales answer needs no long thinking phase. */
const MODEL = "claude-opus-5";

/** Built once per instance. Static, so Anthropic caches it across turns. */
const INSTRUCTIONS = buildSalesInstructions();

const FALLBACK_LINE = "Something went wrong on our side. Please try again in a moment, or book a demo and we will answer in person.";

/**
 * Per-IP request counter, in memory. It resets whenever the instance does and
 * is per instance on a multi-instance deploy, so it is a brake on abuse rather
 * than a hard quota. A shared store would be needed for a hard one.
 */
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_REQUESTS;
}

const bodySchema = z.object({
  messages: z.array(z.unknown()).min(1).max(MAX_MESSAGES_PER_SESSION * 2 + 2),
  pathname: z.string().max(200).optional(),
});

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/**
 * Keep only what the model should see from the visitor: text. File and data
 * parts from a forged client would otherwise be billed as input.
 */
function sanitize(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) =>
    m.role === "user"
      ? { ...m, parts: m.parts.filter((p) => p.type === "text") }
      : m,
  );
}

function tools(pathname: string) {
  return {
    book_demo: tool({
      description:
        "Show the visitor a button to book a live demo on the calendar. Use when they want to see the product, talk to a person, or ask something you cannot answer from the facts.",
      inputSchema: z.object({}),
      execute: async () => ({ url: BOOK_DEMO_URL }),
    }),
    start_signup: tool({
      description: "Show the visitor a button to create an account in the web app. Use when they say they are ready to try it or sign up.",
      inputSchema: z.object({}),
      execute: async () => ({ url: SIGN_UP_URL }),
    }),
    search_docs: tool({
      description:
        "Search the product's help documentation: the written, step-by-step instructions for using WildcatIQ, plus the website privacy policy. Use it whenever the visitor asks how something is done in the app, what a screen or feature does in detail, or how their data is handled. Pass the question in the visitor's own words. Returns the docs that bear on it, best first; then call read_doc on the one you picked and answer from what it says.",
      inputSchema: z.object({
        query: z.string().min(1).max(300).describe("what the visitor wants to know, in their words"),
        section: z.string().optional().describe(`restrict to one section slug. The sections are: ${DOC_SECTION_LIST}`),
      }),
      execute: async ({ query, section }) => {
        if (section && !hasSection(section)) return { ok: false as const, error: `No section "${section}". Sections: ${DOC_SECTION_LIST}` };
        const hits = searchDocs(query, { section, limit: 5 });
        return hits.length === 0 ? { ok: true as const, hits: [], note: "Nothing matched. Try other words, or say the docs do not cover it." } : { ok: true as const, hits };
      },
    }),
    read_doc: tool({
      description: "Read one help doc in full, by the section and slug that search_docs returned. Answer from its words; do not invent steps it does not contain.",
      inputSchema: z.object({ section: z.string(), slug: z.string() }),
      execute: async ({ section, slug }) => {
        const doc = readDoc(section, slug);
        return doc ? { ok: true as const, ...doc } : { ok: false as const, error: `No doc ${section}/${slug}. Use search_docs first.` };
      },
    }),
    request_followup: tool({
      description:
        "Send the visitor's contact details to the WildcatIQ team so a person reaches out. Only call it after the visitor has given a name and email address in this conversation.",
      inputSchema: z.object({
        name: z.string().min(1).max(120),
        email: z.string().email().max(200),
        company: z.string().max(200).optional(),
        wells: z.string().max(60).optional().describe("How many wells they operate, as they said it"),
        note: z.string().max(600).optional().describe("What they want to talk about, in one or two sentences"),
      }),
      execute: async (input) => sendFollowupLead({ ...input, pathname }),
    }),
  };
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[sales-chat] ANTHROPIC_API_KEY is not set");
    return new Response("Chat is not available right now. Please book a demo instead.", { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return new Response("You have sent a lot of messages in a short time. Please wait a few minutes and try again.", {
      status: 429,
    });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("Bad request.", { status: 400 });

  const messages = sanitize(parsed.data.messages as UIMessage[]);
  const pathname = parsed.data.pathname ?? "/";
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length > MAX_MESSAGES_PER_SESSION) {
    return new Response("This chat has reached its limit. Start a new chat to keep going.", { status: 400 });
  }
  if (userMessages.some((m) => textOf(m).length > MAX_MESSAGE_CHARS)) {
    return new Response(`Please keep each message under ${MAX_MESSAGE_CHARS} characters.`, { status: 400 });
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || textOf(last).trim().length === 0) {
    return new Response("Bad request.", { status: 400 });
  }

  // Tell the model which page the visitor is on, as a note on the latest turn.
  // On the turn itself rather than in the instructions, so the cached prefix
  // stays byte-identical across pages.
  const note = `(The visitor is reading ${describePage(pathname)}.)\n\n`;
  const withPage = messages.map((m, i) =>
    i === messages.length - 1
      ? {
          ...m,
          parts: m.parts.map((p, j) => (j === 0 && p.type === "text" ? { ...p, text: note + p.text } : p)),
        }
      : m,
  );

  const result = streamText({
    model: anthropic(MODEL),
    instructions: INSTRUCTIONS,
    messages: await convertToModelMessages(withPage),
    tools: tools(pathname),
    providerOptions: {
      anthropic: {
        // Thinking stays on (Opus 5 default); `low` keeps the silent phase short.
        effort: "low",
        cacheControl: { type: "ephemeral" },
      },
    },
    maxOutputTokens: 2500,
    // Search, read, answer, with room for one more lookup.
    stopWhen: stepCountIs(6),
    onError: ({ error }) => console.error("[sales-chat]", error),
  });

  return result.toUIMessageStreamResponse({
    onError: () => FALLBACK_LINE,
  });
}
