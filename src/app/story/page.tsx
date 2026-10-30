import type { Metadata } from "next";
import { devOnlyPage } from "@/lib/dev-only";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container, Eyebrow, ClosingCta } from "@/components/home/sections";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Our story | WildcatIQ",
  description: "WildcatIQ was built by a father and son who run an independent oil and gas operation in Graham, Texas.",
};

const CHAPTERS: { eyebrow: string; title: string; body: string }[] = [
  {
    eyebrow: "Where it started",
    title: "Forty-five years of operating in Graham, Texas.",
    body: "Jim Poage has run Sky Resources, an independent oil and gas operation in Graham, for forty-five years. Gauge sheets, purchaser statements, run tickets and Railroad Commission filings, kept the way most independents keep them: by hand, in the evenings.",
  },
  {
    eyebrow: "The problem",
    title: "The tools that promised help did not know the business.",
    body: "Rankin grew up around that operation and watched how much of it was still manual. When Jim tried the general AI tools for oil and gas work, they could talk about the industry but could not do anything in it. They had no idea what a run ticket was, could not read a gauge sheet, and knew nothing about his wells.",
  },
  {
    eyebrow: "What we built",
    title: "An assistant that already knows oil and gas, wired into your own operation.",
    body: "WildcatIQ started as the system Sky Resources needed: production, field operations, documents and filings in one place, with Orion on top of it. Orion is built on an operator's knowledge base and reads your wells, your paperwork and your numbers, and nothing is saved until you approve it.",
  },
];

const PEOPLE = [
  {
    name: "Rankin Poage",
    role: "Co-Founder and CEO",
    bio: "Attended SMU on a President's Scholarship and graduated magna cum laude. Finishing the Master in Finance program at Chicago Booth.",
  },
  {
    name: "Jim Poage",
    role: "Co-Founder and Chairman",
    bio: "Independent oil and gas operator in Graham, Texas for forty-five years. Runs Sky Resources.",
  },
];

const VALUES = [
  { title: "Built by operators.", body: "The people who write the software run wells. If it would not work at Sky Resources, it does not ship." },
  { title: "Your data is yours.", body: "Every organization's rows are isolated at the database level, and nothing you upload is ever used to train a model." },
  { title: "Nothing happens without you.", body: "Every change Orion proposes arrives as a card you approve, edit or reject. A person is always in charge." },
  { title: "Independents first.", body: "Built for the operator who does everything, not for a department that does one thing." },
];

function ImageBox({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-dashed border-border bg-muted text-center text-sm text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      <span className="px-6">{label}</span>
    </div>
  );
}

export default function OurStoryPage() {
  devOnlyPage();
  return (
    <main>
      <SiteHeader />

      <section className="pb-16 pt-32 sm:pt-40">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Our story</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">
              Built by independents, for independents.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              WildcatIQ was built by a father and son who run an independent oil and gas operation, because nothing on the market
              knew the business well enough to help.
            </p>
          </div>
          <ImageBox label="Photo" className="mt-14 aspect-[21/9] w-full sm:mt-20" />
        </Container>
      </section>

      {CHAPTERS.map((c) => (
        <section key={c.title} className="border-t border-border py-20 sm:py-28">
          <Container>
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
              <Eyebrow>{c.eyebrow}</Eyebrow>
              <div className="max-w-2xl">
                <h2 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl">{c.title}</h2>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            </div>
          </Container>
        </section>
      ))}

      <section className="border-t border-border bg-muted py-20 sm:py-28">
        <Container>
          <Eyebrow>What we believe</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Four things we will not trade away.</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-background p-6">
                <h3 className="text-lg font-medium tracking-tight">{v.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <Container>
          <Eyebrow>The people</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Who builds it.</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:max-w-3xl">
            {PEOPLE.map((p) => (
              <div key={p.name} className="rounded-xl border border-border p-6">
                <div className="text-base font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.role}</div>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{p.bio}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <ClosingCta headline="Come see what we built." />
      <SiteFooter />
    </main>
  );
}
