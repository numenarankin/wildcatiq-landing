import Link from "next/link";
import { ArrowIcon, CheckCircleIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { FeatureScreen } from "@/components/screens";
import { Rise } from "./rise";
import { BOOK_DEMO_URL, SIGN_UP_URL } from "@/lib/links";
import { COMPARISON_ROWS, FAQ, SECURITY_POINTS, sectionHref, type HomeSection } from "@/lib/site";
import { cn } from "@/lib/utils";
import { DEV_ONLY_VISIBLE, productPageVisible } from "@/lib/dev-only";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-7xl px-6 lg:px-10", className)}>{children}</div>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

export function Hero() {
  return (
    <section className="pb-20 pt-32 sm:pb-28 sm:pt-40">
      <Container>
        <div className="max-w-4xl">
          <Rise>
            <Eyebrow>WildcatIQ</Eyebrow>
          </Rise>
          <Rise delay={0.08}>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              AI for the independent<br />oil &amp; gas operator
            </h1>
          </Rise>
          <Rise delay={0.18}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              WildcatIQ runs production, field operations, documents and regulatory work for independent oil and gas operators, with an
              assistant that already knows the business.
            </p>
          </Rise>
          <Rise delay={0.28} className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={SIGN_UP_URL} external size="lg">
              Get started <ArrowIcon className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href={BOOK_DEMO_URL} variant="outline" size="lg">
              Book a demo
            </ButtonLink>
          </Rise>
        </div>
        {/* The dashboard mounts, paints, then rises, so its first render never lands mid-animation. */}
        <Rise afterPaint delay={0.2} distance={32} duration={1} className="mt-14 sm:mt-20">
          <FeatureScreen slug="dashboard" eager />
        </Rise>
      </Container>
    </section>
  );
}

/**
 * One feature section. Desktop screens all render at the same 1280 x 800 frame,
 * full width under the copy, so every screenshot on the page is the same size.
 * The phone is the one exception and sits beside its copy.
 */
export function FeatureSection({ feature, id }: { feature: HomeSection; flip?: boolean; id?: string }) {
  const isMobile = feature.slug === "mobile";
  const copy = (
    <div className="max-w-3xl">
      <Eyebrow>{feature.eyebrow}</Eyebrow>
      <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">{feature.headline}</h2>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{feature.body}</p>
      {(feature.href || productPageVisible(feature.slug)) && (
        <Link href={sectionHref(feature)} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          More about {feature.label.toLowerCase()} <ArrowIcon className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
  if (isMobile) {
    return (
      <section id={id} className="border-t border-border py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
            {copy}
            <FeatureScreen slug={feature.slug} />
          </div>
        </Container>
      </section>
    );
  }
  return (
    <section id={id} className="border-t border-border py-20 sm:py-28">
      <Container>
        {copy}
        <div className="mt-12 sm:mt-14">
          <FeatureScreen slug={feature.slug} />
        </div>
      </Container>
    </section>
  );
}

export function GettingStarted() {
  const steps = [
    { n: "01", title: "Match your operator number.", body: "Enter your P-5 and WildcatIQ finds your leases and wells in the RRC record." },
    { n: "02", title: "Review the import.", body: "Leases, wells and facilities, ready to accept or edit." },
    { n: "03", title: "Drop in your paperwork.", body: "Old statements and gauge sheets backfill the rest through Orion." },
  ];
  return (
    <section className="border-t border-border bg-muted py-20 sm:py-28">
      <Container>
        <Eyebrow>Day one</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Populated before you enter a single reading.</h2>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Enter your P-5 number and WildcatIQ imports your leases, wells and production history from the RRC. Drop in your old statements
          and gauge sheets and Orion backfills the rest.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-background p-6">
              <span className="font-mono text-sm text-muted-foreground">{s.n}</span>
              <h3 className="mt-4 text-lg font-medium tracking-tight">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function Comparison() {
  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container>
        <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Other tools give you a dashboard. WildcatIQ does the work.
        </h2>
        <div className="mt-12 overflow-hidden rounded-xl border border-border">
          {/* Tighter cells under sm so all three columns fit a phone without clipping. */}
          <table className="w-full text-left">
            <thead className="bg-muted text-xs sm:text-sm">
              <tr>
                <th className="px-3 py-3 font-medium text-muted-foreground sm:px-5"> </th>
                <th className="px-3 py-3 font-semibold sm:px-5">WildcatIQ</th>
                <th className="px-3 py-3 font-medium text-muted-foreground sm:px-5">Spreadsheets, texts and the RRC portal</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((r) => (
                <tr key={r.label} className="border-t border-border text-sm sm:text-base">
                  <td className="px-3 py-4 font-medium sm:px-5">{r.label}</td>
                  <td className="px-3 py-4 sm:px-5">{r.us}</td>
                  <td className="px-3 py-4 text-muted-foreground sm:px-5">{r.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}

export function PricingSummary() {
  return (
    <section className="border-t border-border bg-muted py-20 sm:py-28">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Priced by the well.</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Four bands from 1 to 100+ wells. Every plan includes the whole platform and a monthly allotment of Orion credits.
          </p>
          <ButtonLink href="/pricing" variant="outline" size="lg" className="mt-8">
            See pricing <ArrowIcon className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

export function Security() {
  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Security</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Your data is yours.</h2>
          {DEV_ONLY_VISIBLE && (
            <Link href="/security" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
              How we handle it <ArrowIcon className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SECURITY_POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-xl border border-border p-5 text-base">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function Faq({ items = FAQ }: { items?: readonly { q: string; a: string }[] }) {
  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <h2 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Questions</h2>
        <dl className="divide-y divide-border">
          {items.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="text-lg font-medium">{f.q}</dt>
              <dd className="mt-2 text-base leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

export function ClosingCta({ headline = "Ready to run the company from one place?" }: { headline?: string }) {
  return (
    <section className="border-t border-border bg-muted py-24 sm:py-32">
      <Container className="text-center">
        <h2 className="mx-auto max-w-3xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">{headline}</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href={SIGN_UP_URL} external size="lg">
            Get started <ArrowIcon className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href={BOOK_DEMO_URL} variant="outline" size="lg">
            Book a demo
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
