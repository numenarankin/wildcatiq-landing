"use client";

/**
 * The Files page open on one facility folder, as the app's
 * `/files/folders/[id]` route renders it: the app's `FileBrowser` over the
 * account's tree, in the main column's padding. The screen keeps the open
 * folder in local state rather than the URL (no `basePath`), since the landing
 * has no Files routes to navigate to.
 */
import { FileBrowser } from "@/components/files/file-browser";
import {
  FILES_ROOT,
  SMITH_4_FOLDER_ID,
  SMITH_4_LAS_ID,
  SMITH_T201_FOLDER_ID,
} from "@/lib/screens/documents-files-fixture";
import { ScreenPanel } from "../../panel";

export function DocumentsFilesScreen({ folder }: { folder: "smith-tank" | "smith-4" }) {
  const folderId = folder === "smith-tank" ? SMITH_T201_FOLDER_ID : SMITH_4_FOLDER_ID;
  return (
    <ScreenPanel w={1200} h={720} path="/files">
      <FileBrowser
        root={FILES_ROOT}
        initialFolderId={folderId}
        initialSelected={folder === "smith-4" ? [SMITH_4_LAS_ID] : undefined}
      />
    </ScreenPanel>
  );
}
