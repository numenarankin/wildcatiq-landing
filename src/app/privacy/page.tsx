import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container, Eyebrow } from "@/components/home/sections";

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
      <strong key={i} className="font-medium text-foreground">
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
    <main>
      <SiteHeader />
      <section className="pb-20 pt-32 sm:pt-40">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Legal</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">Privacy Policy</h1>
            {dates.map((line) => (
              <p key={line} className="mt-6 text-sm text-muted-foreground">
                {renderInline(line)}
              </p>
            ))}

            <div className="mt-14">
              {blocks.map((block, i) => {
                if (block.kind === "heading") {
                  return (
                    <h2 key={i} className="mt-12 text-2xl font-medium tracking-tight first:mt-0">
                      {block.text}
                    </h2>
                  );
                }
                if (block.kind === "list") {
                  return (
                    <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-muted-foreground">
                      {block.items.map((item) => (
                        <li key={item}>{renderInline(item)}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {renderInline(block.lines.join(" "))}
                  </p>
                );
              })}
            </div>
          </div>
        </Container>
      </section>
      <SiteFooter />
    </main>
  );
}
