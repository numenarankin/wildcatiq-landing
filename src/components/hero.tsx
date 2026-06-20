import {
  ArrowIcon,
  LogIcon,
  NetworkIcon,
  ChatIcon,
} from "@/components/icons";
import { BOOK_DEMO_URL } from "@/lib/links";

const HIGHLIGHTS = [
  { icon: LogIcon, label: "Understands your well logs" },
  { icon: NetworkIcon, label: "Analyzes your whole operation" },
  { icon: ChatIcon, label: "Answers in plain English" },
] as const;

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Subtle radial glow, matching the dark reference aesthetic */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(120,130,160,0.12),transparent_60%)]"
      />

      <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 pb-20 pt-32 sm:min-h-[640px] sm:pb-24 sm:pt-40 lg:px-10">
        <h1 className="max-w-5xl font-sans text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl sm:leading-[1.05] lg:text-7xl">
          Run your entire oil &amp; gas company with AI
        </h1>

        <div className="mt-8 flex flex-col items-start gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
          <span className="text-base font-semibold text-foreground">
            Personalized AI that:
          </span>
          <ul className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-base font-medium text-muted"
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12">
          <a
            href={BOOK_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-sm bg-foreground px-5 py-2.5 text-base font-semibold text-background transition-opacity hover:opacity-90"
          >
            Book a demo
            <ArrowIcon className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
