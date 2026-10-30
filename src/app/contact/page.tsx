import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container, Eyebrow } from "@/components/home/sections";
import { ContactForm } from "@/components/contact/contact-form";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/icons";
import { BOOK_DEMO_URL, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Contact sales | WildcatIQ",
  description: `Book a demo, or talk to sales at ${CONTACT_EMAIL} or ${CONTACT_PHONE}.`,
};

export default function ContactPage() {
  return (
    <main>
      <SiteHeader />
      <section className="pb-20 pt-32 sm:pb-28 sm:pt-40">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Contact sales</Eyebrow>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">Let&apos;s talk.</h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Book a 30-minute demo, or send us a message and we will get back to you within one business day.
            </p>
            <ButtonLink href={BOOK_DEMO_URL} size="lg" className="mt-8">
              Book a demo <ArrowIcon className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <div className="mt-10 space-y-1 text-base text-muted-foreground">
              <a href={`mailto:${CONTACT_EMAIL}`} className="block transition-colors hover:text-foreground">{CONTACT_EMAIL}</a>
              <a href={`tel:${CONTACT_PHONE_TEL}`} className="block transition-colors hover:text-foreground">{CONTACT_PHONE}</a>
            </div>
          </div>
          <ContactForm />
        </Container>
      </section>
      <SiteFooter />
    </main>
  );
}
