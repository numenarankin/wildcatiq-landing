/**
 * Client-safe mirror of the app's src/lib/ai/conversations.ts: the types and
 * pure helpers the Orion components read. The app's loaders talk to Supabase
 * and are not here; the landing builds conversations from fixtures.
 */
import type { UIMessage } from "@/lib/ai/sdk";

export const NEW_CHAT_TITLE = "New chat";
const MAX_TITLE_LENGTH = 48;

/** A saved Orion conversation. Timestamps are epoch ms for easy sorting. */
export interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Derive a short title from the first user text message, if any. */
export function deriveTitle(messages: UIMessage[]): string | null {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return null;
  const text = firstUser.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
  if (!text) return null;
  return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH).trimEnd()}...` : text;
}

/** The timestamp on a message, if it has one. */
export function messageCreatedAt(message: UIMessage): number | null {
  const raw = (message.metadata as { createdAt?: string } | undefined)?.createdAt;
  if (!raw) return null;
  const at = new Date(raw).getTime();
  return Number.isFinite(at) ? at : null;
}
