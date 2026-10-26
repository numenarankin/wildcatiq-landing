import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container, Eyebrow, ClosingCta } from "@/components/home/sections";
import { SECURITY_DETAILS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security | WildcatIQ",
  description: "How WildcatIQ keeps an operator's data isolated, permissioned and out of model training.",
};

const SECTIONS = SECURITY_DETAILS;

export default function SecurityPage() {
  return (
    <main>
      <SiteHeader />
      <section className="pb-20 pt-32 sm:pt-40">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Security</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">Your data is yours.</h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              An operator&apos;s production and revenue records are the business. Here is how they are handled.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <div key={s.title} className="rounded-xl border border-border p-6">
                <h2 className="text-lg font-medium tracking-tight">{s.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <ClosingCta headline="Questions about how your data is handled? Ask us." />
      <SiteFooter />
    </main>
  );
}
