/**
 * Direct-to-Storage uploads for the Files page: the browser PUTs the bytes
 * straight into the `files` bucket through a signed upload URL, then hands the
 * server a REFERENCE to file.
 *
 * Why this exists: the `uploadFiles` server action buffers the whole multipart
 * body, so every byte crosses the Next request path and is capped three times
 * over (`MAX_UPLOAD_BYTES`, `serverActions.bodySizeLimit`,
 * `proxyClientMaxBodySize`) and bounded a fourth time by the function's
 * duration. A customer ingesting gigabytes cannot go through any of that.
 * Taking a reference removes all four ceilings at once and leaves only
 * Storage's own (see {@link MAX_DIRECT_UPLOAD_BYTES}).
 *
 * The same seam already exists for the phone's scans (`api/kb/files/upload-url`
 * → `finalize`), but that one stages into the accounting bucket and DOWNLOADS
 * the object to re-file it — fine for a 3 MB scan, fatal for a 3 GB file. Here
 * the signed URL points at the final resting place, so no byte is ever copied.
 *
 * Deliberately NOT server-only: the key helpers are pure and unit-tested, and
 * the bucket name is shared with the browser upload call.
 */

export const FILES_BUCKET = "files";

/**
 * Hard ceiling for one file, imposed by Supabase Storage: a standard (single
 * PUT) upload tops out at 5 GB. Anything larger needs the resumable TUS
 * endpoint, which cannot be driven by a signed upload URL and would need
 * `storage.objects` policies on a bucket that deliberately has none.
 *
 * NOTE: the project's own global file-size limit (Dashboard → Storage →
 * Settings) is a SEPARATE, lower ceiling and is not visible from here. When it
 * is set below this value, Storage rejects the PUT with 413 and
 * {@link describeUploadError} is what the user reads.
 */
export const MAX_DIRECT_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024;

export const MAX_DIRECT_UPLOAD_LABEL = "5 GB";

/**
 * Ceiling on what the background pass will READ back out of Storage to index.
 *
 * A stored file is filed and downloadable at any size; being searchable means
 * pulling the bytes into a function and running OCR or a model over them, and
 * past this size that is neither affordable nor useful (nobody asks Orion to
 * read a 400 MB seismic volume). Above it the file is stored and left
 * unindexed rather than failing the upload.
 */
export const MAX_PARSE_BYTES = 100 * 1024 * 1024;

/**
 * Storage key for a directly-uploaded file: `${orgId}/<uuid>`.
 *
 * Older uploads key on the bare file id, which `files.storage_key` records
 * verbatim, so both shapes coexist with no migration. New keys carry the org
 * prefix because `finalizeUploads` receives the key FROM THE CLIENT: without a
 * prefix to check, a forged key could point a new `files` row at another org's
 * bytes. Same rule, and same reason, as `isOwnedStorageKey` in the accounting
 * staging bucket.
 */
export function directUploadKey(orgId: string): string {
  return `${orgId}/${crypto.randomUUID()}`;
}

/** True when `key` sits inside `orgId`'s prefix. See {@link directUploadKey}. */
export function isOwnedFileKey(key: string, orgId: string): boolean {
  if (!orgId || !key.startsWith(`${orgId}/`)) return false;
  // `a/../b` would pass the prefix test and address another org's object.
  const rest = key.slice(orgId.length + 1);
  return rest.length > 0 && !rest.includes("..") && !rest.includes("/");
}

/**
 * Turn a Storage upload failure into something the user can act on.
 *
 * The one that actually happens in the field is the project's global file-size
 * limit being lower than the file: Storage answers 413 with a terse body, and
 * unexplained it looks like our bug rather than a setting in their dashboard.
 */
export function describeUploadError(message: string, bytes: number): string {
  const tooBig =
    /payload too large|exceeded the maximum allowed size|413/i.test(message);
  if (tooBig) {
    return `This file (${formatSize(bytes)}) is larger than the project's Storage file-size limit. Raise it in Supabase → Storage → Settings.`;
  }
  return message;
}

/** Byte size for user-facing copy, scaling into GB (the point of this path). */
export function formatSize(bytes: number): string {
  const gb = 1024 * 1024 * 1024;
  const mb = 1024 * 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(1)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** A one-time signed upload URL, as the browser needs it. */
export interface UploadTarget {
  bucket: string;
  path: string;
  token: string;
}

/** One uploaded object, handed back to be filed. */
export interface FinalizeItem {
  /** The `path` from the {@link UploadTarget} the bytes went to. */
  storageKey: string;
  fileName: string;
  /** The browser's MIME type, or null when it had none. */
  mime: string | null;
  /** Folder id to file it in, or "root". */
  folderId: string;
}

/** What a finalized batch reports back, so the caller can say what happened. */
export interface FinalizeResult {
  filed: number;
  /** One entry per file that could not be filed, with the reason to show. */
  failed: { fileName: string; reason: string }[];
}
