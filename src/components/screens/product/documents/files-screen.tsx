"use client";

/**
 * The Files page, as the app's `/files` route renders it: the app's
 * `FileBrowser` over the account's tree, in the main column's padding. The
 * screen keeps the open folder in local state rather than the URL (no
 * `basePath`), since the landing has no Files routes to navigate to.
 *
 * Played on a loop from the top of the tree: the ticket number typed into the
 * search box finds the pulling-unit ticket Luis scanned on the phone, in Scans
 * (the box matches names anywhere in the tree, as the app's does); the box is
 * cleared, then a facility's folder is opened from its kind's folder (Tanks,
 * Smith T201; or Wells, Smith 4 with its log ticked). Every press is a click
 * on the browser's own row or checkbox, every keystroke goes through its input.
 */
import { useEffect, useRef, useState } from "react";
import { FileBrowser } from "@/components/files/file-browser";
import { FILES_ROOT, SMITH_4_FILES, SMITH_4_LAS_ID } from "@/lib/screens/documents-files-fixture";
import { TICKET_NO } from "@/lib/screens/invoice-fixture";
import { ScreenPanel } from "../../panel";
import { DemoCursor, centreOf, type CursorPoint } from "../recon/cursor";
import { byText, typeInto, usePhases } from "./demo-kit";

type Phase = "root" | "toSearch" | "type" | "found" | "clear" | "toKind" | "kind" | "toFolder" | "folder" | "toTick" | "tick" | "hold";
const ORDER: readonly Phase[] = ["root", "toSearch", "type", "found", "clear", "toKind", "kind", "toFolder", "folder", "toTick", "tick", "hold"];
const KEY_MS = 140;
const HOLD: Record<Phase, number> = {
  root: 1600,
  toSearch: 900,
  type: TICKET_NO.length * KEY_MS + 300,
  found: 3200,
  clear: 900,
  toKind: 900,
  kind: 1300,
  toFolder: 900,
  folder: 1300,
  toTick: 900,
  tick: 600,
  hold: 3600,
};

const LAS_NAME = SMITH_4_FILES.find((f) => f.id === SMITH_4_LAS_ID)!.name;

export function DocumentsFilesScreen({ folder }: { folder: "smith-tank" | "smith-4" }) {
  const { phase, loop, active } = usePhases(ORDER, HOLD);
  const root = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);
  const [kind, facility] = folder === "smith-tank" ? ["Tanks", "Smith T201"] : ["Wells", "Smith 4"];

  useEffect(() => {
    if (!active) return;
    const scope = () => root.current?.parentElement ?? null;
    const search = () => scope()?.querySelector<HTMLInputElement>('input[aria-label="Search files and folders"]') ?? null;
    /** A folder's row, by the name in its name cell. */
    const row = (name: string) => byText(scope(), "tr span.font-medium", name)?.closest("tr") ?? null;
    const tick = () => scope()?.querySelector<HTMLElement>(`[aria-label="Select ${LAS_NAME}"]`) ?? null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const press = () => setCursor((c) => (c ? { ...c, down: true } : c));
    const aim = (el: Element | null | undefined, dx = 0) => {
      const c = centreOf(el);
      if (c) setCursor({ x: c.x + dx, y: c.y, down: false });
    };
    const frame = requestAnimationFrame(() => {
      switch (phase) {
        case "root":
          setCursor(null);
          break;
        case "toSearch":
          aim(search(), -40);
          break;
        case "type":
          press();
          search()?.focus();
          for (let i = 1; i <= TICKET_NO.length; i++) {
            timers.push(setTimeout(() => typeInto(search(), TICKET_NO.slice(0, i)), i * KEY_MS));
          }
          break;
        case "found":
          setCursor((c) => (c ? { ...c, down: false } : c));
          break;
        case "clear":
          typeInto(search(), "");
          search()?.blur();
          break;
        case "toKind":
          aim(row(kind)?.querySelector("span.font-medium"));
          break;
        case "kind":
          press();
          row(kind)?.click();
          break;
        case "toFolder":
          aim(row(facility)?.querySelector("span.font-medium"));
          break;
        case "folder":
          press();
          row(facility)?.click();
          break;
        case "toTick":
          if (folder === "smith-4") aim(tick());
          else setCursor((c) => (c ? { ...c, down: false } : c));
          break;
        case "tick":
          if (folder === "smith-4") {
            press();
            tick()?.click();
          }
          break;
        case "hold":
          setCursor((c) => (c ? { ...c, down: false } : c));
          break;
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [active, phase, folder, kind, facility]);

  return (
    <ScreenPanel w={1200} h={720} path="/files">
      <div ref={root} className="hidden" />
      {/* A fresh browser at the top of the tree each time round. */}
      <FileBrowser key={loop} root={FILES_ROOT} />
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}
