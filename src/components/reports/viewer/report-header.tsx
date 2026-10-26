import type { ReactNode } from "react";

/**
 * A report's header: its title (with Narrate) on the left and the page's
 * actions on the right, level with each other; the report's pickers on the
 * row beneath, the period at the left and the facility filters at the right.
 *
 * Plain flex rows, so a narrow column wraps rather than squeezing: the actions
 * drop under the title, still right-aligned, and the pickers wrap the same
 * way. Shared by the document and its loading skeleton, so the actions stay
 * put while a report loads.
 */
export function ReportHeader({
  title,
  actions,
  pickers,
}: {
  title: ReactNode;
  actions?: ReactNode;
  pickers?: ReactNode;
}) {
  return (
    // The section heading that follows drops its top margin: the header's own
    // margin is the gap, not the two stacked.
    <div className="mb-4 flex flex-col gap-3 [&+h2]:mt-0">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-h-9 min-w-0 flex-wrap items-center gap-3">
          {title}
        </div>
        {actions ? (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {pickers}
    </div>
  );
}
