/**
 * Turning a browser folder pick into a plan: which folders to create, and which
 * folder each file lands in.
 *
 * A `<input webkitdirectory>` hands back a FLAT `File[]`; the tree only exists
 * as a `webkitRelativePath` string on each file (`Leases/2024/scan.pdf`). The
 * shape of the upload — how many folders, in what order, and what goes where —
 * is therefore a pure function of those strings, which is why it lives here
 * rather than inside the component or the server action.
 *
 * Loose (non-folder) files have an empty relative path and plan to the folder
 * the user is standing in, so one code path serves both upload buttons.
 */

/** One file as the browser hands it over. */
export interface PickedFile {
  name: string;
  /** `webkitRelativePath`, or "" for a file picked individually. */
  relativePath: string;
}

export interface UploadPlan<T> {
  /**
   * Every folder to ensure, ancestors BEFORE descendants, as slash-joined paths
   * relative to the folder the user is in. `ensureUploadFolders` walks them in
   * this order so a parent always exists before its child is created.
   */
  dirs: string[];
  /** The files to upload, each tagged with the dir path it belongs in ("" = here). */
  items: { file: T; dir: string }[];
  /**
   * Files left out of the plan: OS bookkeeping (`.DS_Store`, `Thumbs.db`) and
   * anything under a dot-directory. A folder pick drags these in by the dozen
   * and filing them would bury the documents the user actually chose.
   */
  skipped: T[];
}

/** `.DS_Store`, `Thumbs.db`, `desktop.ini` and friends. */
function isNoise(name: string): boolean {
  if (name.startsWith(".")) return true;
  return /^(thumbs\.db|desktop\.ini|icon\r?)$/i.test(name);
}

/** Path segments, with empty/`.`/`..` segments dropped rather than obeyed. */
function segments(relativePath: string): string[] {
  return relativePath
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "." && s !== "..");
}

/**
 * Plan an upload from the picked files.
 *
 * `read` maps the caller's object to its name + relative path, so the same
 * function serves a real `File` (browser) and a plain fixture (test).
 */
export function planUpload<T>(
  files: T[],
  read: (file: T) => PickedFile
): UploadPlan<T> {
  const dirs: string[] = [];
  const seenDirs = new Set<string>();
  const items: { file: T; dir: string }[] = [];
  const skipped: T[] = [];

  for (const file of files) {
    const { name, relativePath } = read(file);
    if (isNoise(name)) {
      skipped.push(file);
      continue;
    }
    // The last segment is the file itself; everything before it is the tree.
    const parts = segments(relativePath);
    const dirParts = parts.slice(0, -1);
    if (dirParts.some(isNoise)) {
      skipped.push(file);
      continue;
    }

    // Record each ancestor once, shallowest first — the order the server needs.
    let path = "";
    for (const part of dirParts) {
      path = path ? `${path}/${part}` : part;
      if (seenDirs.has(path)) continue;
      seenDirs.add(path);
      dirs.push(path);
    }
    items.push({ file, dir: path });
  }

  return { dirs, items, skipped };
}

/** Split into fixed-size groups, preserving order. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error("chunk: size must be >= 1");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Run `work` over `items` with at most `limit` in flight, and collect the
 * failures instead of propagating them.
 *
 * Uploads are network-bound and independent, so a folder of 400 documents
 * wants several going at once — but not 400, which starves the browser's
 * connection pool and makes every one of them slow. One file that throws is
 * one file that failed: stranding the other 399 behind it would turn a bad
 * connection into a lost import, so the error is returned, not raised.
 *
 * `onSettled` fires once per item, finished or failed, which is what drives
 * the progress count.
 */
export async function runPool<T>(
  items: T[],
  limit: number,
  work: (item: T) => Promise<void>,
  onSettled?: () => void
): Promise<{ item: T; error: unknown }[]> {
  const failures: { item: T; error: unknown }[] = [];
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      try {
        await work(items[i]);
      } catch (error) {
        failures.push({ item: items[i], error });
      } finally {
        onSettled?.();
      }
    }
  });
  await Promise.all(runners);
  return failures;
}
