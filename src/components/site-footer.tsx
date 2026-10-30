import Link from "next/link";
import Image from "next/image";
import { PRODUCT_MENU, SOLUTIONS, sectionHref } from "@/lib/site";
import { DEV_ONLY_VISIBLE } from "@/lib/dev-only";
import { BOOK_DEMO_URL, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_TEL, SIGN_IN_URL } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:px-10">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/slim_normal.png" alt="" width={903} height={859} aria-hidden className="h-6 w-6 object-contain" />
            <span className="text-lg font-semibold tracking-tight">WildcatIQ</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Production, field operations, documents and regulatory work for independent oil and gas operators, in one place.
          </p>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-foreground">{CONTACT_EMAIL}</a>
            <br />
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="transition-colors hover:text-foreground">{CONTACT_PHONE}</a>
          </p>
          <p className="mt-6 text-xs text-muted-foreground">© 2026 Wildcat Labs, Inc.</p>
        </div>

        <Column title="Product">
          {PRODUCT_MENU.map((f) => (
            <FooterLink key={f.slug} href={sectionHref(f)}>{f.label}</FooterLink>
          ))}
        </Column>

        <Column title="Solutions">
          {SOLUTIONS.filter((s) => s.group === "By role").map((s) => (
            <FooterLink key={s.slug} href={`/solutions/${s.slug}`}>{s.label}</FooterLink>
          ))}
        </Column>

        <Column title="Company">
          <FooterLink href="/contact">Contact</FooterLink>
          {DEV_ONLY_VISIBLE && (
            <>
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/security">Security</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
            </>
          )}
          <FooterLink href={BOOK_DEMO_URL}>Book a demo</FooterLink>
          <FooterLink href={SIGN_IN_URL} external>Sign in</FooterLink>
        </Column>
      </div>
    </footer>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  const cls = "text-sm text-foreground/80 transition-colors hover:text-foreground";
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
      ) : (
        <Link href={href} className={cls}>{children}</Link>
      )}
    </li>
  );
}
