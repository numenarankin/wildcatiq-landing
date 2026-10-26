"use client";

/**
 * Stand-in for the AI SDK (`ai` + `@ai-sdk/react`), which the landing does not
 * install. The copied Orion components import these names; here `useChat`
 * returns the fixture conversation unchanged and the transport helpers are
 * inert, so the real chat JSX renders a fixed transcript.
 */
import { createContext, useCallback, useContext, useState } from "react";

export type UIMessageRole = "system" | "user" | "assistant";

export type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

export type UIMessagePart =
  | { type: "text"; text: string; state?: "streaming" | "done" }
  | { type: "reasoning"; text: string; state?: "streaming" | "done" }
  | { type: "file"; mediaType: string; filename?: string; url: string }
  | { type: "step-start" }
  | {
      type: `tool-${string}`;
      toolCallId: string;
      state: ToolPartState;
      input?: unknown;
      output?: unknown;
      errorText?: string;
      approval?: { id: string; approved?: boolean; reason?: string };
    }
  | {
      type: "dynamic-tool";
      toolName: string;
      toolCallId: string;
      state: ToolPartState;
      input?: unknown;
      output?: unknown;
      errorText?: string;
    }
  | { type: `data-${string}`; id?: string; data: unknown };

export interface UIMessage {
  id: string;
  role: UIMessageRole;
  metadata?: unknown;
  parts: UIMessagePart[];
}

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

export interface SendMessagePayload {
  text: string;
  files?: { type: "file"; mediaType: string; filename: string; url: string }[];
}

/** The shape of the app's `new DefaultChatTransport({...})` argument; nothing reads it here. */
export class DefaultChatTransport {
  constructor(options: {
    api: string;
    fetch?: typeof fetch;
    body?: () => Record<string, unknown>;
  }) {
    void options;
  }
}

export function lastAssistantMessageIsCompleteWithApprovalResponses(): boolean {
  return false;
}

export interface UseChatOptions {
  id?: string;
  messages?: UIMessage[];
  transport?: DefaultChatTransport;
  experimental_throttle?: number;
  sendAutomaticallyWhen?: unknown;
  onData?: (part: { type: string; data?: unknown }) => void;
  onError?: (err: Error) => void;
}

/**
 * A scripted transcript. When a screen provides one, `useChat` returns its
 * messages and status instead of the fixture, so the real chat JSX can play a
 * conversation forward: typing, thinking, streaming, approval.
 */
export interface ChatScript {
  messages: UIMessage[];
  status: ChatStatus;
}

export const ChatScriptContext = createContext<ChatScript | null>(null);

export function useChat(options: UseChatOptions): {
  messages: UIMessage[];
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  status: ChatStatus;
  error: Error | undefined;
  stop: () => Promise<void>;
  addToolApprovalResponse: (response: { id: string; approved: boolean }) => void;
} {
  const [fixed] = useState<UIMessage[]>(() => options.messages ?? []);
  const script = useContext(ChatScriptContext);
  const sendMessage = useCallback(async () => {}, []);
  const stop = useCallback(async () => {}, []);
  const addToolApprovalResponse = useCallback(() => {}, []);
  return {
    messages: script?.messages ?? fixed,
    sendMessage,
    status: script?.status ?? "ready",
    error: undefined,
    stop,
    addToolApprovalResponse,
  };
}
