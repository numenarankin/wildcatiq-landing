"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { BOOK_DEMO_URL, SIGN_IN_URL, SIGN_UP_URL } from "@/lib/links";
import { PRODUCT_MENU, SOLUTIONS, sectionHref } from "@/lib/site";
import { cn } from "@/lib/utils";
import { setDemosPaused } from "@/components/screens/demo-active";

type MenuId = "product" | "solutions";

/**
 * The mobile menu's one motion: the panel's slide, the backdrop's fade and the
 * icon's turn all run on this curve and duration together, so they read as one
 * movement. A gentle ease-in-out, not a front-loaded ease-out that jumps.
 */
const MENU_MOTION = { duration: 0.35, ease: [0.32, 0.72, 0, 1] } as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState<MenuId | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close a desktop menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const byRole = SOLUTIONS.filter((s) => s.group === "By role");

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* While the mobile menu is open the page behind it darkens and blurs; a tap there closes it. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-backdrop"
            aria-hidden
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm will-change-[opacity] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MENU_MOTION}
          />
        )}
      </AnimatePresence>
      <div
        className={cn(
          // Above the mobile menu, which slides out from under it.
          "relative z-10 border-b transition-colors",
          // Solid while the mobile menu is open, so the darkened backdrop does not tint the bar.
          menuOpen
            ? "border-border bg-background duration-0"
            : scrolled || open
              ? "border-border bg-background/90 backdrop-blur-md"
              : "border-transparent bg-transparent",
        )}
      >
        <nav
          ref={navRef}
          className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6 lg:px-10"
        >
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5 text-foreground" onClick={() => setOpen(null)}>
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

            <ul className="hidden items-center gap-1 md:flex">
              <li className="relative">
                <MenuButton label="Product" active={open === "product"} onClick={() => setOpen(open === "product" ? null : "product")} />
                {open === "product" && (
                  <Panel className="w-max">
                    <div className="grid grid-cols-[repeat(2,max-content)] gap-x-8 gap-y-1">
                      {PRODUCT_MENU.map((f) => (
                        <Link
                          key={f.slug}
                          href={sectionHref(f)}
                          onClick={() => setOpen(null)}
                          className="rounded-lg px-3 py-2.5 transition-colors hover:bg-black/[0.03]"
                        >
                          <div className="text-sm font-semibold">{f.label}</div>
                          <div className="mt-0.5 text-sm text-muted-foreground">{f.tagline}</div>
                        </Link>
                      ))}
                    </div>
                  </Panel>
                )}
              </li>
              <li className="relative">
                <MenuButton label="Solutions" active={open === "solutions"} onClick={() => setOpen(open === "solutions" ? null : "solutions")} />
                {open === "solutions" && (
                  <Panel className="w-max">
                    {byRole.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/solutions/${s.slug}`}
                        onClick={() => setOpen(null)}
                        className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-black/[0.03]"
                      >
                        <div className="text-sm font-semibold">{s.label}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">{s.headline}</div>
                      </Link>
                    ))}
                  </Panel>
                )}
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={() => setOpen(null)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={SIGN_IN_URL}
              className="inline-flex items-center px-3 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-70"
            >
              Sign in
            </a>
            <a
              href={BOOK_DEMO_URL}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.03]"
            >
              Book a demo
            </a>
            <a
              href={SIGN_UP_URL}
              className="inline-flex items-center rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get started
            </a>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              // Demos hold still while the menu covers the page; they resume once it has closed.
              if (!menuOpen) setDemosPaused(true);
              setMenuOpen((v) => !v);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.14)] ring-1 ring-black/5 transition-colors hover:bg-muted md:hidden"
          >
            {/* Both glyphs stacked in one cell and cross-faded, so the circle is never empty. */}
            <span className="grid [&>*]:col-start-1 [&>*]:row-start-1">
              <motion.span
                className="flex"
                initial={false}
                animate={{ opacity: menuOpen ? 0 : 1, rotate: menuOpen ? 90 : 0 }}
                transition={MENU_MOTION}
              >
                <MenuGlyph />
              </motion.span>
              <motion.span
                className="flex"
                initial={false}
                animate={{ opacity: menuOpen ? 1 : 0, rotate: menuOpen ? 0 : -90 }}
                transition={MENU_MOTION}
              >
                <CloseGlyph />
              </motion.span>
            </span>
          </button>

        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence onExitComplete={() => setDemosPaused(false)}>
        {menuOpen && (
          <motion.div
            key="menu-panel"
            className="border-b border-border bg-background shadow-lg will-change-transform md:hidden"
            // Solid all the way, sliding down from behind the bar: a fading panel
            // would show its links over the page beneath for the first frames.
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={MENU_MOTION}
          >
            <div className="mx-auto max-w-7xl px-6 py-4">
              <MobileGroup title="Product">
                {PRODUCT_MENU.map((f) => (
                  <MobileLink key={f.slug} href={sectionHref(f)} onClick={() => setMenuOpen(false)}>
                    {f.label}
                  </MobileLink>
                ))}
              </MobileGroup>
              <MobileGroup title="Solutions">
                {byRole.map((s) => (
                  <MobileLink key={s.slug} href={`/solutions/${s.slug}`} onClick={() => setMenuOpen(false)}>
                    {s.label}
                  </MobileLink>
                ))}
              </MobileGroup>
              <MobileLink href="/contact" onClick={() => setMenuOpen(false)}>
                Contact
              </MobileLink>
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                <a
                  href={SIGN_IN_URL}
                  className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  Sign in
                </a>
                <a
                  href={BOOK_DEMO_URL}
                  className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  Book a demo
                </a>
                <a
                  href={SIGN_UP_URL}
                  className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
                >
                  Get started
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={cn(
        "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("h-3.5 w-3.5 transition-transform", active && "rotate-180")} aria-hidden>
        <path d="M4 6l4 4 4-4" />
      </svg>
    </button>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("absolute left-0 top-[calc(100%+0.75rem)] w-[40rem] rounded-xl border border-border bg-background p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]", className)}>
      {children}
    </div>
  );
}

function MobileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="grid grid-cols-2">{children}</div>
    </div>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-md px-2 py-2 text-base font-medium text-foreground transition-colors hover:bg-black/[0.03]"
    >
      {children}
    </Link>
  );
}

function MenuGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-6 w-6" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-6 w-6" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
