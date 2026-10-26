// The app logs every settled tool call to the console. No-op on the landing.
import type { UIMessage } from "@/lib/ai/sdk";

export function logToolParts(messages: UIMessage[] | UIMessage | undefined): void {
  void messages;
}

export function resetToolLog(): void {}
