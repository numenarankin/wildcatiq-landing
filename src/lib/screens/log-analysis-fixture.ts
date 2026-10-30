/**
 * The home page's log-analysis screen: a project for Smith 4's recompletion
 * holding the well's files, the LAS those files carry written out as LAS 2.0
 * text for the app's own parser and viewer, and the depth window the viewer
 * zooms to: the zone Orion's answer names as the recompletion
 * (`lasReplies()` in orion-las-fixture.ts), picked by the same rule.
 */
import type { RepoFolder } from "@/lib/kb/types";
import { LAS_FILE_NAME, smith4Las } from "./mobile-b-fixture";
import { SMITH_4_FILES } from "./documents-files-fixture";
import { behindPipeZones } from "./orion-las-fixture";

export const PROJECT_NAME = "Smith 4 recompletion";
export const PROJECT_FOLDER_ID = "folder-project-smith-4-recompletion";
export const PROJECT_PATH = "/projects/smith-4-recompletion";

/** The project folder: Smith 4's files placed into it (placements share the file ids). */
export const PROJECT_TREE: RepoFolder = {
  id: PROJECT_FOLDER_ID,
  name: PROJECT_NAME,
  modified: "Oct 14, 2026",
  folders: [],
  files: SMITH_4_FILES.map((f) => ({ ...f, folder_id: PROJECT_FOLDER_ID })),
};

export const PROJECT_LAS = PROJECT_TREE.files.find((f) => f.name === LAS_FILE_NAME)!;

/** The Smith 4 log as the file on disk: `~V`, `~W`, `~C` and the `~A` rows. */
export function smith4LasText(): string {
  const las = smith4Las();
  const pad = (s: string, n: number) => s.padEnd(n);
  const step = las.data[0][1] - las.data[0][0];
  const lines = [
    "~VERSION INFORMATION",
    " VERS.   2.0 : CWLS LOG ASCII STANDARD - VERSION 2.0",
    " WRAP.   NO  : ONE LINE PER DEPTH STEP",
    "~WELL INFORMATION",
    ` STRT.ft  ${las.depth.start.toFixed(1)} : START DEPTH`,
    ` STOP.ft  ${las.depth.stop.toFixed(1)} : STOP DEPTH`,
    ` STEP.ft  ${step.toFixed(1)} : STEP`,
    " NULL.    -999.25 : NULL VALUE",
    ` WELL.    ${las.well.WELL} : WELL`,
    ` FLD .    ${las.well.FLD} : FIELD`,
    ` API .    ${las.well.API} : API NUMBER`,
    "~CURVE INFORMATION",
    ...las.curves.map((c) => ` ${pad(`${c.mnemonic}.${c.unit}`, 10)} : ${c.mnemonic}`),
    "~A",
  ];
  const [depth, ...curves] = las.data;
  for (let i = 0; i < depth.length; i++) {
    lines.push([depth[i].toFixed(1), ...curves.map((c) => c[i].toFixed(4))].map((v) => v.padStart(11)).join(""));
  }
  return lines.join("\n");
}

/** Feet of margin the zoom keeps above and below the zone. */
const ZOOM_MARGIN_FT = 60;

/**
 * The recompletion zone's interval, padded: the first of `behindPipeZones()`,
 * the zone `lasReplies()` names.
 */
export function recompletionWindow(): [number, number] {
  const pick = behindPipeZones()[0];
  return [pick.top - ZOOM_MARGIN_FT, pick.base + ZOOM_MARGIN_FT];
}
