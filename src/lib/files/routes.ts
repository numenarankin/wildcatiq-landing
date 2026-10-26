/**
 * URLs for the Files browser.
 *
 * Every folder and file addresses by its own id rather than by a chain of
 * ancestors (`/files/a/b/c`) or by name (`/files/leases/2026`). The ancestor
 * chain is already derivable from the tree the page loads, so putting it in the
 * URL would duplicate state that goes stale the moment a folder moves, and
 * names break on rename and collide between siblings. An id survives both, which
 * is the property a reload-safe URL needs.
 */

/** The synthetic root of the tree; it has no `folders` row of its own. */
export const ROOT_FOLDER_ID = "root";

/**
 * Link to a folder. `basePath` lets a scoped browser (a project's Files tab)
 * mount the same routes under its own prefix later.
 */
export function folderHref(folderId: string, basePath = "/files"): string {
  return folderId === ROOT_FOLDER_ID
    ? basePath
    : `${basePath}/folders/${folderId}`;
}

/**
 * Link to a file's viewer/editor page. `from` is the folder the user opened it
 * from, so Back returns THERE: a file can sit in several folders (a scan in
 * `Scans` that is also on a well), and without it Back went to the oldest
 * placement, which was Scans for every scanned document.
 */
export function docHref(fileId: string, from?: string): string {
  const base = `/files/docs/${fileId}`;
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}
