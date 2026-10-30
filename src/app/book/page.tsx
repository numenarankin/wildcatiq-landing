import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/home/sections";
import { BookingWidget } from "@/components/book/booking-widget";

export const metadata: Metadata = {
  title: "Book a demo | WildcatIQ",
  description: "Book a 30-minute WildcatIQ demo at your office.",
};

export default function BookPage() {
  return (
    <main>
      <SiteHeader />
      <section className="pb-24 pt-24 sm:pb-28 sm:pt-28">
        <Container>
          <BookingWidget />
        </Container>
      </section>
      <SiteFooter />
    </main>
  );
}
