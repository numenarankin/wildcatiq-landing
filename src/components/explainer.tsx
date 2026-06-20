const STEPS = [
  {
    n: "01",
    title: "Add your operation",
    body: "Your production reports, well logs, accounting, vendors, and files all go in one place. The records you already keep, now together.",
  },
  {
    n: "02",
    title: "Ask Orion, or put it to work",
    body: "Get a straight answer to any question. Or hand Orion the job: log production from a run sheet, fill in a well's equipment, add a well, set a calendar reminder, or draft a memo. Orion always asks before it changes anything.",
  },
  {
    n: "03",
    title: "Orion gets smarter the more you use it",
    body: "The more you put in and the more you ask, the more Orion learns your wells, your numbers, and the way you like things done. Orion sharpens over time.",
  },
] as const;

export function Explainer() {
  return (
    <section className="border-y border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">
          How it works
        </p>
        <h2 className="mt-3 max-w-3xl font-sans text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          One place for your whole operation, and an assistant that knows all of
          it.
        </h2>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
            >
              <span className="font-mono text-sm text-muted">{step.n}</span>
              <h3 className="mt-4 text-lg font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
