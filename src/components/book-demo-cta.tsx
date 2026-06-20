import { ArrowIcon } from "@/components/icons";

/** Closing call-to-action: book a product demo. */
export function BookDemoCta() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-6 py-28 text-center lg:px-10">
        <h2 className="mx-auto max-w-3xl font-sans text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
          Ready to modernize your operation with AI?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Book a 30-minute demonstration to see how WildcatIQ can add value
          across your energy business.
        </p>
        <div className="mt-10 flex justify-center">
          <a
            href="#"
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
