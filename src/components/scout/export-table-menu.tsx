"use client";

/**
 * The Export button a Recon modal carries in its header, as the app draws it
 * (`ExportMenu`, icon only). On the landing the menu opens and choosing a
 * format does nothing: there is no export route behind it.
 */
import { ExportMenu } from "@/components/export/export-menu";
import type { ScoutExportSubject, ScoutTableAny } from "@/lib/scout/exports/tables";

export function ScoutExportMenu<D>({
  subject,
  subjectKey,
  table,
  dossier,
}: {
  subject: ScoutExportSubject;
  subjectKey: string;
  table: ScoutTableAny<D>;
  dossier: D;
}) {
  void subject;
  void subjectKey;
  void dossier;
  return <ExportMenu label="" ariaLabel={`Export ${table.title.toLowerCase()}`} variant="ghost" onExport={() => {}} />;
}
