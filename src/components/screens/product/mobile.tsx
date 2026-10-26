"use client";

/**
 * The Mobile page's section screens: DOM transcriptions of the wildcat-phone
 * React Native screens (each file's header names its RN sources), drawn in
 * the phone frame from mobile/phone.tsx and fed mobile-fixture.ts.
 */
import type { SectionScreens } from "./types";
import { MeterReadingScreen } from "./mobile/meter-reading";
import { RunTicketScreen } from "./mobile/run-ticket";
import { LeaseOfflineScreen } from "./mobile/lease-offline";
import { ReadingRemarksScreen } from "./mobile/note-editor";
import { PhoneDashboardScreen } from "./mobile/dashboard";
import { LasPreviewScreen } from "./mobile/las-preview";
import { CommentsScreen } from "./mobile/comments";
import { OrionChatScreen } from "./mobile/orion-chat";
import { SecurityScreen } from "./mobile/security";

export const mobileScreens: SectionScreens = {
  readings: { Component: MeterReadingScreen, phone: true },
  tickets: { Component: RunTicketScreen, phone: true },
  offline: { Component: LeaseOfflineScreen, phone: true },
  dictation: { Component: ReadingRemarksScreen, phone: true },
  dashboard: { Component: PhoneDashboardScreen, phone: true },
  logs: { Component: LasPreviewScreen, phone: true },
  comments: { Component: CommentsScreen, phone: true },
  orion: { Component: OrionChatScreen, phone: true },
  security: { Component: SecurityScreen, phone: true },
};
