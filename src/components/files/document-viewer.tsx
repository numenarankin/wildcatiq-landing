"use client";

/**
 * The app's in-app document viewer (`components/files/document-viewer.tsx`),
 * its LAS path: the back button and title over the bordered white field, with
 * the log in the app's `LasPreview`. landing: the file's URL is handed in (a
 * blob of the fixture's LAS text) where the app fetches a signed URL, and
 * `zoom` passes through to the viewer's scripted zoom.
 */
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LasPreview } from "@/components/files/las-preview";
import type { RepoFile } from "@/lib/kb/types";

export function DocumentViewer({
  file,
  name,
  url,
  zoom,
  onBack,
}: {
  file: RepoFile;
  name: string;
  url: string;
  zoom?: [number, number] | null;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" aria-label="Back" onClick={onBack}>
          <ArrowLeftIcon />
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {name}
        </h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.15rem] border border-border bg-white">
        {/* FilePreview routes a .las by name to the log viewer, keyed by url. */}
        <LasPreview key={url} url={url} name={file.name} zoom={zoom} />
      </div>
    </div>
  );
}
