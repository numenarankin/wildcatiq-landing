import { notFound } from "next/navigation";
import { productPageListed } from "@/lib/site";

/**
 * Pages kept off the topbar are local-only: `npm run dev` serves them, a
 * production build answers 404 and drops every link to them.
 */
export const DEV_ONLY_VISIBLE = process.env.NODE_ENV !== "production";

/** Call first in a local-only page. */
export function devOnlyPage() {
  if (!DEV_ONLY_VISIBLE) notFound();
}

/** A product page is served in production only when the topbar lists it. */
export function productPageVisible(slug: string): boolean {
  return DEV_ONLY_VISIBLE || productPageListed(slug);
}
