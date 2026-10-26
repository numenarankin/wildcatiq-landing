"use client";

/**
 * A page with the Orion drawer docked beside it, the way the app shell lays
 * them out: the page as a flex sibling, narrowed by the drawer, and the
 * drawer's real `ChatPanel` holding one conversation.
 */
import { ChatPanel } from "@/components/ai/chat-panel";
import type { Conversation } from "@/lib/ai/conversations";
import { ScreenPanel } from "@/components/screens/panel";

/** The drawer's width in the screenshot, inside the app's 320 to 720 px range. */
const DRAWER_W = 440;

export function OrionDrawerScreen({
  path,
  conversation,
  pagePad = false,
  children,
}: {
  path: string;
  conversation: Conversation;
  /** The app's main-column padding around the page. */
  pagePad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ScreenPanel w={1320} h={760} path={path} pad={false}>
      <div className="flex h-full w-full">
        <div className={pagePad ? "relative flex min-w-0 flex-1 flex-col overflow-hidden px-10 py-6" : "relative flex min-w-0 flex-1 flex-col overflow-hidden"}>
          {children}
        </div>
        <aside aria-label="Orion assistant" className="h-full shrink-0 overflow-hidden border-l border-border" style={{ width: DRAWER_W }}>
          <div className="h-full" style={{ width: DRAWER_W }}>
            <ChatPanel
              key={conversation.id}
              conversationId={conversation.id}
              initialMessages={conversation.messages}
              onClose={() => {}}
            />
          </div>
        </aside>
      </div>
    </ScreenPanel>
  );
}
