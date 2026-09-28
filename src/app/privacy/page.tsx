import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy | WildcatIQ",
  description: "How WildcatIQ collects, uses, and protects your information.",
};

// The policy text lives in wildcat-privacy-policy.md at the project root, the
// single source of truth. This page renders the small markdown subset it uses:
// ## headings, paragraphs, "- " bullets, and **bold**.
const POLICY_PATH = path.join(process.cwd(), "wildcat-privacy-policy.md");

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: string[] };

function parsePolicy(source: string) {
  const dates: string[] = [];
  const blocks: Block[] = [];
  const chunks = source.trim().split(/\n\s*\n/);

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((line) => line.trim());
    if (lines[0].startsWith("# ")) continue;
    if (lines[0].startsWith("## ")) {
      blocks.push({ kind: "heading", text: lines[0].slice(3) });
      continue;
    }
    if (lines.every((line) => line.startsWith("- "))) {
      blocks.push({ kind: "list", items: lines.map((line) => line.slice(2)) });
      continue;
    }
    if (blocks.length === 0) {
      dates.push(...lines);
      continue;
    }
    blocks.push({ kind: "paragraph", lines });
  }

  return { dates, blocks };
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-medium text-neutral-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export default function PrivacyPage() {
  const { dates, blocks } = parsePolicy(readFileSync(POLICY_PATH, "utf8"));

  return (
    <main className="flex-1 bg-white text-neutral-900">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Image
            src="/slim_normal.png"
            alt=""
            width={903}
            height={859}
            aria-hidden
            className="h-6 w-6 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">WildcatIQ</span>
        </Link>

        <h1 className="mt-16 text-4xl font-medium tracking-tight">
          Privacy Policy
        </h1>
        {dates.map((line) => (
          <p key={line} className="mt-3 text-sm text-neutral-500">
            {renderInline(line)}
          </p>
        ))}

        {blocks.map((block, i) => {
          if (block.kind === "heading") {
            return (
              <h2 key={i} className="mt-12 text-lg font-medium tracking-tight">
                {block.text}
              </h2>
            );
          }
          if (block.kind === "list") {
            return (
              <ul
                key={i}
                className="mt-3 list-disc space-y-1.5 pl-5 leading-7 text-neutral-700"
              >
                {block.items.map((item) => (
                  <li key={item}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="mt-3 leading-7 text-neutral-700">
              {renderInline(block.lines.join(" "))}
            </p>
          );
        })}
      </div>
    </main>
  );
}
