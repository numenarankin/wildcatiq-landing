/**
 * Upload size ceiling, shared by the client-side pre-flight checks (data-entry
 * dropzone) and the `uploadFiles` server action.
 *
 * All queued files POST as a single multipart request, so the binding limit is
 * the COMBINED size, not any one file. The Next request limits in
 * `next.config.ts` (`serverActions.bodySizeLimit` +
 * `experimental.proxyClientMaxBodySize`) are set deliberately ABOVE this value
 * so a legitimately full-size upload never trips the framework's multipart
 * truncation — which surfaces to the user as the opaque "Unexpected end of
 * form" error. Keep those config values > MAX_UPLOAD_BYTES if you change this.
 */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

/** `MAX_UPLOAD_BYTES` rendered for user-facing copy, e.g. "100 MB". */
export const MAX_UPLOAD_LABEL = "100 MB";

/** Human-readable byte size, e.g. `1.5 MB`, `320 KB`, `12 B`. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
