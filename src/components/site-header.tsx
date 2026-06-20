"use client";

import { useEffect, useState } from "react";
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
            scrolled
              ? "bg-background/50 backdrop-blur-md"
              : "bg-transparent backdrop-blur-0"
          }`}
        />

        <nav className="relative flex h-full items-center justify-between gap-6 px-6 lg:px-10">
            {/* Brand + left-aligned nav */}
            <div className="flex items-center gap-10">
              <a href="#" className="flex items-center gap-2.5 text-foreground">
                <LogoIcon className="h-6 w-6" aria-hidden />
                <span className="text-lg font-semibold tracking-tight">
                  WildcatIQ
                </span>
              </a>

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

            {/* Auth actions */}
            <div className="flex items-center gap-2">
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
        </nav>
      </div>
    </header>
  );
}
