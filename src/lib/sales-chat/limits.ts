/**
 * Caps on the public sales chat. Shared by the route (enforced) and the panel
 * (so the input stops before the server refuses). Change them here only.
 */

/** Visitor turns allowed in one conversation before it asks for a new chat. */
export const MAX_MESSAGES_PER_SESSION = 25;

/** Characters allowed in one visitor message. */
export const MAX_MESSAGE_CHARS = 1500;

/** Requests one IP may make inside the window below. */
export const RATE_LIMIT_REQUESTS = 40;

/** The rate-limit window, in milliseconds. */
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
