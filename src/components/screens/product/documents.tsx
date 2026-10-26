"use client";

import type { SectionScreens } from "./types";
import { DocumentsLive } from "../documents-live";
import { DocumentsCropScreen } from "./documents/crop-screen";
import { DocumentsFilesScreen } from "./documents/files-screen";
import {
  DocumentsGreasebookScreen,
  DocumentsOnFileScreen,
  DocumentsUploadScreen,
  DocumentsWellScreen,
} from "./documents/ingest";

export const documentsScreens: SectionScreens = {
  upload: { Component: DocumentsUploadScreen },
  photos: { Component: DocumentsCropScreen },
  statements: { Component: DocumentsLive },
  well: { Component: DocumentsWellScreen },
  greasebook: { Component: DocumentsGreasebookScreen },
  "on-file": { Component: DocumentsOnFileScreen },
  cabinet: { Component: () => <DocumentsFilesScreen folder="smith-tank" /> },
  logs: { Component: () => <DocumentsFilesScreen folder="smith-4" /> },
};
