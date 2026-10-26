"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/links";
import { FEATURES, SOLUTIONS } from "@/lib/site";
import { cn } from "@/lib/utils";

type MenuId = "product" | "solutions";

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
      <div
        className={cn(
          "border-b transition-colors",
          scrolled || open || menuOpen
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
                      {FEATURES.map((f) => (
                        <Link
                          key={f.slug}
                          href={`/product/${f.slug}`}
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
                  href="/story"
                  onClick={() => setOpen(null)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Our story
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  onClick={() => setOpen(null)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={SIGN_IN_URL}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.03]"
            >
              Sign in
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
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-black/[0.03] md:hidden"
          >
            {menuOpen ? <CloseGlyph /> : <MenuGlyph />}
          </button>

        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-b border-border bg-background md:hidden">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <MobileGroup title="Product">
              {FEATURES.map((f) => (
                <MobileLink key={f.slug} href={`/product/${f.slug}`} onClick={() => setMenuOpen(false)}>
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
            <MobileLink href="/story" onClick={() => setMenuOpen(false)}>
              Our story
            </MobileLink>
            <MobileLink href="/pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </MobileLink>
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
              <a
                href={SIGN_IN_URL}
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Sign in
              </a>
              <a
                href={SIGN_UP_URL}
                className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      )}
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
