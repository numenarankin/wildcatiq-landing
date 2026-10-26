/**
 * The Files tree Sky Resources' account holds on FIXTURE_TODAY, shaped as the
 * app's `getFilesRoot()` returns it (`lib/kb/files.ts`): the system folders
 * every org is seeded with (`lib/files/system-folders-seed.ts`), a folder per
 * facility under its root named after the facility, and the files placed in
 * them. Sizes and dates are display strings formatted the way the app formats
 * them (`formatSize`, `formatDate`), and each folder's files are sorted the
 * app's way: pinned first, then newest first.
 */
import type { KBFileType, RepoFile, RepoFolder } from "@/lib/kb/types";
import { LEASES, OIL_PURCHASER, OPERATOR, SWD, TANKS, WELLS } from "./operator";
import { LAS_FILE_NAME } from "./mobile-b-fixture";

/** A placed file plus who uploaded it. The app keeps the uploader on `files`; the browser does not show it. */
export interface FixtureFile extends RepoFile {
  uploadedBy: string;
}

const JIM = OPERATOR.owner;
const LUIS = OPERATOR.pumper;

/** `lib/kb/files.ts` formatSize. */
function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  const rounded = value < 10 && i > 0 ? value.toFixed(1) : String(Math.round(value));
  return `${rounded} ${units[i]}`;
}

/** `lib/kb/files.ts` formatDate, pinned to UTC so the server and browser agree. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The app's `fileType`: PDFs, markdown and images by extension, everything else `doc`. */
function typeOf(name: string): KBFileType {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "md") return "md";
  if (["png", "jpg", "jpeg", "tif", "tiff", "heic"].includes(ext)) return "image";
  return "doc";
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function file(
  folderId: string,
  name: string,
  bytes: number,
  at: string,
  uploadedBy: string,
  pinned = false,
): FixtureFile {
  return {
    id: `file-${slug(name)}`,
    name,
    path: name,
    type: typeOf(name),
    folder_id: folderId,
    size: formatSize(bytes),
    modified: formatDate(at),
    createdAt: at,
    updatedAt: at,
    pinned,
    source: "upload",
    uploadedBy,
  };
}

const newestFirst = (a: RepoFile, b: RepoFile) =>
  Number(b.pinned) - Number(a.pinned) ||
  (b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
  a.name.localeCompare(b.name);

function folder(id: string, name: string, created: string, children: RepoFolder[] = [], files: RepoFile[] = []): RepoFolder {
  return {
    id,
    name,
    modified: formatDate(created),
    folders: [...children].sort((a, b) => a.name.localeCompare(b.name)),
    files: [...files].sort(newestFirst),
  };
}

/** Folder ids the product screens open on. */
export const SMITH_T201_FOLDER_ID = "folder-tanks-smith-t201";
export const SMITH_4_FOLDER_ID = "folder-wells-smith-4";

/** The account was set up at the start of September; facility folders date from the RRC import. */
const SEEDED = "2026-09-02T15:10:00Z";

export const SMITH_T201_FILES: FixtureFile[] = [
  file(SMITH_T201_FOLDER_ID, "smith-t201-gauge-sheet-2026-10.jpg", 3_412_870, "2026-10-27T13:42:00Z", LUIS, true),
  file(SMITH_T201_FOLDER_ID, "greasebook-smith-t201-2026-09.xlsx", 48_210, "2026-10-03T14:05:00Z", JIM),
  file(SMITH_T201_FOLDER_ID, `${OIL_PURCHASER.fileStem}-2026-09.pdf`, 412_660, "2026-10-21T16:20:00Z", JIM),
  file(SMITH_T201_FOLDER_ID, "smith-t201-strapping-chart.pdf", 1_184_300, "2026-09-04T18:31:00Z", JIM),
];

export const SMITH_4_FILES: FixtureFile[] = [
  file(SMITH_4_FOLDER_ID, LAS_FILE_NAME, 398_644, "2026-10-14T19:12:00Z", JIM),
  file(SMITH_4_FOLDER_ID, "smith-4-w2-completion.pdf", 862_400, "2026-09-18T15:48:00Z", JIM),
  file(SMITH_4_FOLDER_ID, "smith-4-1987-induction.tif", 18_874_368, "2026-09-18T15:52:00Z", LUIS),
];

/** The Smith 4 log a screen opens ticked. */
export const SMITH_4_LAS_ID = SMITH_4_FILES[0].id;

const wellFolders = [...WELLS.map((w) => w.name), SWD.name].map((name) =>
  folder(`folder-wells-${slug(name)}`, name, SEEDED, [], name === "Smith 4" ? SMITH_4_FILES : []),
);
const leaseFolders = LEASES.map((l) => folder(`folder-leases-${l.slug}`, l.name, SEEDED));
const tankFolders = TANKS.map((t) =>
  folder(`folder-tanks-${slug(t.name)}`, t.name, SEEDED, [], t.name === "Smith T201" ? SMITH_T201_FILES : []),
);
const meterFolders = ["Smith M1", "Johnson A M1", "Roach Parrott M1"].map((name) =>
  folder(`folder-meters-${slug(name)}`, name, SEEDED),
);
const batteryFolders = LEASES.map((l) => `${l.name} Battery`).map((name) =>
  folder(`folder-batteries-${slug(name)}`, name, SEEDED),
);

export const FILES_ROOT: RepoFolder = {
  id: "root",
  name: "Files",
  modified: "",
  files: [],
  folders: [
    folder("folder-chat-attachments", "Chat Attachments", SEEDED),
    folder("folder-projects", "Projects", SEEDED),
    folder("folder-wells", "Wells", SEEDED, wellFolders),
    folder("folder-leases", "Leases", SEEDED, leaseFolders),
    folder("folder-tanks", "Tanks", SEEDED, tankFolders),
    folder("folder-meters", "Meters", SEEDED, meterFolders),
    folder("folder-batteries", "Batteries", SEEDED, batteryFolders),
    folder("folder-data-entry", "Data Entry", SEEDED),
    folder("folder-scans", "Scans", SEEDED),
  ].sort((a, b) => a.name.localeCompare(b.name)),
};
