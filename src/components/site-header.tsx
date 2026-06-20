"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { SIGN_IN_URL, SIGN_UP_URL } from "@/lib/links";

const NAV_ITEMS = [
  { label: "Exploration", href: "/#exploration" },
  { label: "Production", href: "/#production" },
  { label: "Finance", href: "/#finance" },
  { label: "Operations", href: "/#operations" },
  { label: "Pricing", href: "/#pricing" },
] as const;

export function SiteHeader() {
  // Transparent at the very top, then a small floating blur once scrolling.
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="relative mx-auto h-20 max-w-7xl">
        {/* Floating blurred backdrop. Spans the full width of the page-content
            container, inset symmetrically (top/bottom) so the nav content's
            vertical center never moves. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-x-4 inset-y-2 rounded-2xl transition duration-300 ${
            scrolled || menuOpen
              ? "bg-background/50 backdrop-blur-md"
              : "bg-transparent backdrop-blur-0"
          }`}
        />

        <nav className="relative flex h-full items-center justify-between gap-6 px-6 lg:px-10">
          {/* Brand + left-aligned nav */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5 text-foreground">
              <LogoIcon className="h-6 w-6" aria-hidden />
              <span className="text-lg font-semibold tracking-tight">
                WildcatIQ
              </span>
            </Link>

            <ul className="hidden items-center gap-8 md:flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Auth actions (desktop) */}
          <div className="hidden items-center gap-2 md:flex">
            <a
              href={SIGN_IN_URL}
              className="inline-flex items-center rounded-sm border border-white/15 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
            >
              Sign in
            </a>
            <a
              href={SIGN_UP_URL}
              className="inline-flex items-center rounded-sm bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get started
            </a>
          </div>

          {/* Hamburger (mobile) */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-sm text-foreground transition-colors hover:bg-white/5 md:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </nav>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="absolute inset-x-4 top-[4.75rem] rounded-2xl border border-white/10 bg-background/90 p-4 backdrop-blur-md md:hidden">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-sm px-2 py-2.5 text-base font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-4">
              <a
                href={SIGN_IN_URL}
                className="inline-flex items-center justify-center rounded-sm border border-white/15 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
              >
                Sign in
              </a>
              <a
                href={SIGN_UP_URL}
                className="inline-flex items-center justify-center rounded-sm bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Get started
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
