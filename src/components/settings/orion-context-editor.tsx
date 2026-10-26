"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2Icon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SettingsCard,
  SETTINGS_RADIUS,
} from "@/components/settings/panel";
import { cn } from "@/lib/utils";
// landing: the app's types and server actions, answered from the fixture.
type OrionDocType = "persona" | "memory";
interface OrionUserDocs {
  persona: string;
  memory: string;
}
export interface OrionContextRevision {
  version: number;
  content: string;
  updatedBy: string;
  rationale: string | null;
  createdAt: string;
}
async function saveUserContextDocAction(type: OrionDocType, content: string): Promise<void> {
  void type;
  void content;
}
async function rollbackUserContextDocAction(type: OrionDocType, version: number): Promise<void> {
  void type;
  void version;
}
async function listUserContextRevisionsAction(
  type: OrionDocType,
  fixture: Partial<Record<OrionDocType, OrionContextRevision[]>> = {}
): Promise<OrionContextRevision[]> {
  return fixture[type] ?? [];
}

/**
 * Per-user editors for Orion's PERSONA (how you want Orion to behave) and MEMORY
 * (durable facts about your operation). Both are also auto-revised by the
 * post-response reflection loop; every version is kept, so an auto-edit is one
 * click to roll back. This is per USER, not per org: each operator steers their
 * own Orion.
 *
 * Two things about the memory doc drove its shape here:
 *
 *  - **Nobody sees markdown.** The reflection loop writes it with headings and
 *    bullets, and the people using this run pumping units, not text editors.
 *    So it is edited the way a note is edited, in the same Tiptap editor the
 *    notes and files screens use: type, and it looks like what it is. Markdown
 *    is what gets STORED (the doc goes into a system prompt), converted on the
 *    way in and out, and never shown.
 *  - **It does not scroll.** The loop grows this doc without asking, so a fixed
 *    six-row box hid most of what Orion actually believes about your operation
 *    inside a scrollbar. Both fields size to their content instead.
 */

interface DocMeta {
  type: OrionDocType;
  title: string;
  blurb: string;
  placeholder: string;
  /**
   * Edit as formatted text rather than in a plain box. The memory doc carries
   * structure (headings, bullets); the persona doc is a couple of sentences
   * about how you like to be spoken to, and a plain box suits it better.
   */
  rich?: boolean;
}

const DOCS: DocMeta[] = [
  {
    type: "persona",
    title: "How Orion should work with you",
    blurb:
      "Tone, verbosity, and defaults. e.g. “keep answers short”, “always confirm before writing”, “I run the pumping unit myself”.",
    placeholder: "Tell Orion how you like to work…",
  },
  {
    type: "memory",
    title: "What Orion remembers about your operation",
    blurb:
      "Durable facts Orion carries into every chat: your naming (“the Smith lease”), recurring wells, priorities. Orion also updates this on its own.",
    placeholder: "Facts you want Orion to always keep in mind…",
    rich: true,
  },
];

/**
 * The memory doc, edited as formatted text.
 *
 * landing: the app edits this in Tiptap (not installed here). The same
 * container and `tiptap` text classes render the stored markdown, read only.
 */
function RichField({
  markdown,
  onChange,
  placeholder,
}: {
  markdown: string;
  onChange: (nextMarkdown: string) => void;
  placeholder: string;
}) {
  void onChange;
  void placeholder;
  return (
    <div
      className={cn(
        "border border-input bg-background focus-within:ring-2 focus-within:ring-ring",
        SETTINGS_RADIUS
      )}
    >
      <div className="tiptap min-h-24 w-full p-3 text-sm leading-relaxed outline-none [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}

/**
 * The persona doc: a plain box that is always exactly as tall as its text.
 *
 * The box is a one-cell grid holding two things: the textarea, and an invisible
 * `::after` carrying the same string. The replica is what has a height, so the
 * cell is content-sized and the textarea stretches to fill it. The two must
 * keep identical type and padding or the replica measures the wrong height,
 * which is why those classes are spelled out on both rather than shared through
 * a variable (Tailwind only sees literal class names).
 *
 * `field-sizing: content` would do this in one declaration, but it is still
 * missing from enough browsers that the field would silently go back to
 * scrolling on them, which is the bug being fixed.
 */
function GrowingField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <div
      // The trailing space gives the replica something to measure on the last
      // line, so a newline at the end still opens a row.
      data-replica={`${value} `}
      className={cn(
        "grid w-full border border-input bg-background focus-within:ring-2 focus-within:ring-ring",
        SETTINGS_RADIUS,
        "after:col-start-1 after:row-start-1 after:invisible after:w-full after:p-3 after:text-sm after:leading-relaxed after:whitespace-pre-wrap after:break-words after:content-[attr(data-replica)]"
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="col-start-1 row-start-1 w-full resize-none overflow-hidden bg-transparent p-3 text-sm leading-relaxed outline-none"
      />
    </div>
  );
}

function DocEditor({
  meta,
  initial,
  historyOpen = false,
  fixture = {},
}: {
  meta: DocMeta;
  initial: string;
  historyOpen?: boolean;
  fixture?: Partial<Record<OrionDocType, OrionContextRevision[]>>;
}) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // landing: a screen can open with the history already listed.
  const [showHistory, setShowHistory] = useState(historyOpen);
  const [revisions, setRevisions] = useState<OrionContextRevision[] | null>(() =>
    historyOpen ? (fixture[meta.type] ?? []) : null
  );
  // Bumped when a rollback replaces the document, to remount the rich editor
  // on the restored text.
  const [seed, setSeed] = useState(0);

  const dirty = value !== saved;

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await saveUserContextDocAction(meta.type, value);
        setSaved(value);
        if (showHistory) setRevisions(await listUserContextRevisionsAction(meta.type, fixture));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save that.");
      }
    });
  }

  /** Throw away the edits and go back to what is stored. */
  function cancel() {
    setValue(saved);
    setError(null);
    // Only the rich editor needs this: it holds its own copy of the document,
    // so resetting `value` alone would leave the edits on screen.
    setSeed((n) => n + 1);
  }

  function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next && revisions === null) {
      startTransition(async () => {
        try {
          setRevisions(await listUserContextRevisionsAction(meta.type, fixture));
        } catch {
          setRevisions([]);
        }
      });
    }
  }

  function rollback(version: number) {
    setError(null);
    startTransition(async () => {
      try {
        await rollbackUserContextDocAction(meta.type, version);
        const revs = await listUserContextRevisionsAction(meta.type, fixture);
        setRevisions(revs);
        const restored = revs[0]?.content ?? "";
        setValue(restored);
        setSaved(restored);
        setSeed((n) => n + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't roll back.");
      }
    });
  }

  return (
    <SettingsCard className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold">{meta.title}</h3>
        <p className="text-xs text-muted-foreground">{meta.blurb}</p>
      </div>

      {meta.rich ? (
        <RichField
          key={seed}
          markdown={saved}
          onChange={setValue}
          placeholder={meta.placeholder}
        />
      ) : (
        <GrowingField
          value={value}
          onChange={setValue}
          placeholder={meta.placeholder}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button size="lg" onClick={save} disabled={!dirty || pending}>
          {pending && (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          )}
          Save
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={cancel}
          disabled={!dirty || pending}
        >
          Cancel
        </Button>
        <Button size="lg" variant="ghost" onClick={toggleHistory}>
          {showHistory ? "Hide history" : "History"}
        </Button>
        {dirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>

      {showHistory && (
        <ul className="mt-1 space-y-1 border-t border-border pt-2">
          {(revisions ?? []).length === 0 && (
            <li className="text-xs text-muted-foreground">No history yet.</li>
          )}
          {(revisions ?? []).map((r) => (
            <li
              key={r.version}
              className="flex items-start justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <span className="font-medium">v{r.version}</span>{" "}
                <span
                  className={cn(
                    "rounded px-1",
                    r.updatedBy === "agent"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {r.updatedBy === "agent" ? "Orion" : r.updatedBy === "user" ? "you" : "system"}
                </span>{" "}
                {r.rationale && (
                  <span className="text-muted-foreground">{r.rationale}</span>
                )}
                <p className="truncate text-muted-foreground">{r.content}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => rollback(r.version)}
                disabled={pending}
                title={`Roll back to v${r.version}`}
              >
                <RotateCcwIcon className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}

export function OrionContextEditor({
  docs,
  revisions = {},
  historyOpen = [],
}: {
  docs: OrionUserDocs;
  /** landing: the version history the app reads per doc. */
  revisions?: Partial<Record<OrionDocType, OrionContextRevision[]>>;
  /** landing: docs whose history opens expanded. */
  historyOpen?: OrionDocType[];
}) {
  // No wrapping "Your Orion" heading: this renders under the AI tab's Orion
  // subtab, which is already the header for it. Each doc keeps its own title —
  // those name the two different documents, not the section.
  return (
    <div className="flex flex-col gap-3">
      {DOCS.map((meta) => (
        <DocEditor
          key={meta.type}
          meta={meta}
          initial={meta.type === "persona" ? docs.persona : docs.memory}
          historyOpen={historyOpen.includes(meta.type)}
          fixture={revisions}
        />
      ))}
    </div>
  );
}
