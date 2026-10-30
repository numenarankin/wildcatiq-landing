"use client";

/**
 * The Mobile page's section screens: DOM transcriptions of the
 * mobile-background React Native screens (each file's header names its RN
 * sources), drawn in the phone frame from mobile/phone.tsx. The gauge entry
 * is the hero (screens/mobile-screen.tsx), so it has no section here.
 */
import type { SectionScreens } from "./types";
import { OrionChatScreen } from "./mobile/orion-chat";
import { RunTicketScreen } from "./mobile/run-ticket";
import { PhoneDashboardScreen } from "./mobile/dashboard";
import { LeaseOfflineScreen } from "./mobile/lease-offline";
import { CommentsScreen } from "./mobile/comments";

export const mobileScreens: SectionScreens = {
  orion: { Component: OrionChatScreen, phone: true },
  tickets: { Component: RunTicketScreen, phone: true },
  dashboard: { Component: PhoneDashboardScreen, phone: true },
  offline: { Component: LeaseOfflineScreen, phone: true },
  comments: { Component: CommentsScreen, phone: true },
};
