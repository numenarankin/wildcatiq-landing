"use client";

import type { SectionScreens } from "./types";
import { DocumentsLive } from "../documents-live";
import { DocumentsPhoneScanScreen } from "./documents/phone-scan";
import { DocumentsFilesScreen } from "./documents/files-screen";
import {
  DocumentsUploadScreen,
  DocumentsWellScreen,
} from "./documents/ingest";

export const documentsScreens: SectionScreens = {
  upload: { Component: DocumentsUploadScreen },
  "phone-scan": { Component: DocumentsPhoneScanScreen, phone: true },
  statements: { Component: DocumentsLive },
  well: { Component: DocumentsWellScreen },
  cabinet: { Component: () => <DocumentsFilesScreen folder="smith-tank" /> },
};
