"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Globe, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddressInput, type PickedPlace } from "@/components/book/address-input";

/**
 * On-site demo booking (admin docs/plans/demo-booking.md). Step one sends the
 * office address to /api/book/availability; the calendar shows only the
 * times admin says the owner can drive to; Confirm books through
 * /api/book/confirm, which puts it on the owner's calendar and invites the visitor.
 */

const FIELD =
  "w-full rounded-md border border-border bg-background px-3.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/50 focus:ring-3 focus:ring-foreground/5";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MEETING = "30m";
const CARD_MOTION = { duration: 0.4, ease: [0.32, 0.72, 0, 1] as const };

type Day = { y: number; m: number; d: number };

const key = ({ y, m, d }: Day) => y * 10000 + m * 100 + d;
const addDays = ({ y, m, d }: Day, n: number): Day => {
  const t = new Date(y, m, d + n);
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};

/** Today on the Central calendar, since every slot is in Central time. */
function centralToday(): Day {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month") - 1, d: get("day") };
}

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = ({ y, m, d }: Day) => `${y}-${pad(m + 1)}-${pad(d)}`;
const dayOf = (k: string): Day => {
  const [y, m, d] = k.split("-").map(Number);
  return { y, m: m - 1, d };
};

const clock = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" });
/** "9:00am", in Central. */
const timeLabel = (iso: string) => clock.format(new Date(iso)).replace(" ", "").toLowerCase();
const MEETING_MS = 30 * 60 * 1000;
const endLabel = (iso: string) => clock.format(new Date(Date.parse(iso) + MEETING_MS)).toLowerCase();

interface Availability {
  place: { address: string; lat: number; lng: number };
  /** Open slot starts (ISO) by Central date. */
  days: Record<string, string[]>;
}

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return (await res.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

const longDate = (day: Day) =>
  new Date(day.y, day.m, day.d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const noopSubscribe = () => () => {};

/** The calendar depends on the visitor's clock, so it renders on the client only. */
export function BookingWidget() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <div className="min-h-[600px]" />;
  return <Booking />;
}


function Booking() {
  const [today] = useState<Day>(centralToday);
  const [view, setView] = useState<{ y: number; m: number } | null>(() => ({ y: today.y, m: today.m }));
  const [selected, setSelected] = useState<Day | null>(null);
  /** The chosen slot's start, ISO. */
  const [slot, setSlot] = useState<string | null>(null);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [picked, setPicked] = useState<PickedPlace | null>(null);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [step, setStep] = useState<"info" | "pick" | "confirm" | "done">("info");
  // The card takes the next step's size only once the old step has faded out.
  const [shown, setShown] = useState(step);
  const go = setStep;
  const [info, setInfo] = useState({ name: "", email: "", company: "", office: "" });

  const cells = useMemo(() => {
    if (!view) return [];
    const lead = new Date(view.y, view.m, 1).getDay();
    const count = new Date(view.y, view.m + 1, 0).getDate();
    // Always five weeks, ending with the week that holds next month's 1st. A month
    // that would need six drops its first week, which the previous month shows.
    const weeks = Math.ceil((lead + count + 1) / 7);
    const cells = [...Array(lead).fill(null), ...Array.from({ length: weeks * 7 - lead }, (_, i) => addDays({ y: view.y, m: view.m, d: 1 }, i))] as (Day | null)[];
    return cells.slice(-35);
  }, [view]);

  const slotsFor = (day: Day) => avail?.days[dateKey(day)] ?? [];
  const slots = selected ? slotsFor(selected) : [];
  const atFirstMonth = !!(view && today && view.y === today.y && view.m === today.m);
  const dates = avail ? Object.keys(avail.days).sort() : [];
  const lastDay = dates.length ? dayOf(dates[dates.length - 1]) : null;
  const atLastMonth = !!(view && lastDay && view.y === lastDay.y && view.m === lastDay.m);
  const shiftMonth = (n: number) => setView((v) => (v ? { y: new Date(v.y, v.m + n).getFullYear(), m: new Date(v.y, v.m + n).getMonth() } : v));

  /** Loads open times for the office; lands on the first open day. */
  async function loadAvailability(): Promise<boolean> {
    const body = await postJson<{ place?: Availability["place"]; days?: { date: string; slots: string[] }[]; error?: string }>(
      "/api/book/availability",
      { address: picked?.address ?? info.office, lat: picked?.lat, lng: picked?.lng, website },
    );
    if (body?.error === "address") {
      setAddressError("We couldn't find that address.");
      return false;
    }
    if (body?.error === "texas") {
      setAddressError("On-site demos are in Texas only.");
      return false;
    }
    if (!body?.place || !body.days) {
      setError("We couldn't load open times. Please try again.");
      return false;
    }
    const days = Object.fromEntries(body.days.map((d) => [d.date, d.slots]));
    setAvail({ place: body.place, days });
    const first = body.days.find((d) => d.slots.length);
    if (first) {
      const day = dayOf(first.date);
      setSelected(day);
      setView({ y: day.y, m: day.m });
    } else {
      setSelected(null);
    }
    return true;
  }

  const detailItems = (
    <>
    {(step === "confirm" || step === "done") && selected && slot && (
      <li className="flex gap-2.5">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          {longDate(selected)}
          <br />
          {timeLabel(slot).replace(/(am|pm)$/, " $1")} to {endLabel(slot)}
        </span>
      </li>
    )}
    <li className="flex items-center gap-2.5">
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      {MEETING}
    </li>
    <li className="flex items-start gap-2.5 [&>svg]:mt-0.5">
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      {avail?.place.address ?? (info.office.trim() || "Your office")}
    </li>
    <li className="flex items-center gap-2.5">
      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      Central time
    </li>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className={cn("mx-auto", shown === "pick" ? "max-w-[1040px]" : shown === "confirm" || shown === "done" ? "max-w-[560px]" : "max-w-[760px]")}
    >
      <motion.h1 layout="position" transition={CARD_MOTION} className="mb-6 text-2xl font-medium tracking-tight sm:text-3xl">
        Book an on-site demo
      </motion.h1>
      <motion.div
        layout
        transition={CARD_MOTION}
        style={{ borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)" }}
        className="overflow-hidden border border-border bg-background lg:h-[540px]"
      >
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => setShown(step)}>
      <motion.div
        key={step}
        layout
        transition={CARD_MOTION}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        className={cn(
          "grid lg:h-full",
          step === "pick" ? "lg:grid-cols-[260px_1fr_260px]" : step === "confirm" ? "lg:grid-rows-[auto_1fr]" : step === "done" ? "" : "md:grid-cols-[260px_1fr]",
        )}
      >
        {/* Meeting details */}
        {step !== "done" && (
        <div className={cn("p-6", step === "confirm" ? "flex flex-col items-center pb-2 text-center" : "border-b border-border md:border-b-0 md:border-r")}>
          <Image src="/slim_normal.png" alt="" aria-hidden width={903} height={859} className="h-7 w-7 object-contain" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">WildcatIQ</p>
          <h2 className="mt-1 text-xl font-medium tracking-tight">WildcatIQ Demo</h2>
          <ul className={cn("mt-4 space-y-3 text-sm font-medium", step === "confirm" && "w-fit text-left")}>{detailItems}</ul>
          {step === "pick" && (
            <button
              type="button"
              onClick={() => go("info")}
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Edit details
            </button>
          )}
        </div>
        )}

        {step === "pick" && (
          <>
            {/* Month */}
            <div className="flex flex-col border-b border-border p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium">
                  {view ? MONTHS[view.m] : ""} <span className="font-normal text-muted-foreground">{view?.y}</span>
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    disabled={atFirstMonth}
                    onClick={() => shiftMonth(-1)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    disabled={atLastMonth}
                    onClick={() => shiftMonth(1)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 grid flex-1 grid-cols-7 gap-1.5 text-center lg:grid-rows-[auto_repeat(5,1fr)]">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {w}
                  </div>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <div key={`blank-${i}`} />;
                  const nextMonthStart = day.d === 1 && view && day.m !== view.m;
                  const open = slotsFor(day).length > 0;
                  const isSelected = selected && key(selected) === key(day);
                  const isToday = today && key(today) === key(day);
                  return (
                    <button
                      key={key(day)}
                      type="button"
                      disabled={!open}
                      onClick={() => {
                        setSelected(day);
                        setSlot(null);
                      }}
                      className={cn(
                        "relative flex aspect-square items-center lg:aspect-auto justify-center rounded-lg text-sm transition-colors",
                        isSelected
                          ? "bg-foreground font-medium text-background"
                          : open
                            ? "bg-muted font-medium text-foreground hover:bg-foreground/10"
                            : "text-muted-foreground/60",
                      )}
                    >
                      {nextMonthStart && (
                        <span className="absolute left-0 top-0 -translate-y-1/2 rounded bg-muted px-1 text-[10px] font-medium uppercase text-muted-foreground">
                          {MONTHS[day.m].slice(0, 3)}
                        </span>
                      )}
                      {day.d}
                      {isToday && <span className={cn("absolute bottom-1.5 h-1 w-1 rounded-full", isSelected ? "bg-background" : "bg-foreground")} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Times */}
            <div className="flex flex-col p-6 lg:min-h-0">
              <p className="text-base font-medium">
                {selected ? new Date(selected.y, selected.m, selected.d).toLocaleDateString("en-US", { weekday: "short" }) : ""}{" "}
                <span className="font-normal text-muted-foreground">{selected?.d}</span>
              </p>
              {error && <p className="mt-3 text-sm text-muted-foreground">{error}</p>}
              {!selected && <p className="mt-3 text-sm text-muted-foreground">No open times in the next six weeks. Please contact us.</p>}
              <div className="mt-4 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto max-lg:max-h-[420px]">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSlot(s);
                      setError(null);
                      go("confirm");
                    }}
                    className="flex items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-muted"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    {timeLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "info" && (
          <form
            className="grid content-start gap-4 p-6 lg:min-h-0 lg:grid-rows-[auto_auto_auto_auto_1fr]"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              setError(null);
              setAddressError(null);
              const ok = await loadAvailability();
              setBusy(false);
              if (ok) go("pick");
            }}
          >
            {([
              { id: "name", label: "Your name", autoComplete: "name" },
              { id: "email", label: "Email address", type: "email", autoComplete: "email", placeholder: "you@company.com" },
              { id: "company", label: "Company name", autoComplete: "organization" },
            ] as const).map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="mb-1.5 block text-sm font-medium">
                  {f.label} <span className="text-muted-foreground">*</span>
                </label>
                <input
                  id={f.id}
                  name={f.id}
                  type={"type" in f ? f.type : "text"}
                  required
                  autoComplete={f.autoComplete}
                  placeholder={"placeholder" in f ? f.placeholder : undefined}
                  value={info[f.id]}
                  onChange={(e) => setInfo((v) => ({ ...v, [f.id]: e.target.value }))}
                  className={FIELD}
                />
              </div>
            ))}
            <div>
              <label htmlFor="office" className="mb-1.5 block text-sm font-medium">
                Office address <span className="text-muted-foreground">*</span>
              </label>
              <AddressInput
                id="office"
                value={info.office}
                onChange={(office) => {
                  setAddressError(null);
                  setInfo((v) => ({ ...v, office }));
                }}
                onPick={setPicked}
                invalid={addressError !== null}
                className={cn(FIELD, "aria-invalid:border-destructive")}
              />
              {addressError && <p className="mt-1.5 text-sm text-destructive">{addressError}</p>}
            </div>
            {/* Hidden from people; bots fill it. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <div className="flex items-end justify-end gap-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                {busy ? "Finding times" : "Continue"}
              </button>
            </div>
          </form>
        )}

        {step === "confirm" && (
          <form
            className="grid content-start gap-3 p-6 pt-4 lg:min-h-0 lg:grid-rows-[1fr_auto_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy || !avail || !slot) return;
              setBusy(true);
              setError(null);
              const body = await postJson<{ ok?: boolean; reason?: string }>("/api/book/confirm", {
                name: info.name,
                email: info.email,
                company: info.company,
                address: avail.place.address,
                lat: avail.place.lat,
                lng: avail.place.lng,
                start: slot,
                notes,
                website,
              });
              if (body?.ok) {
                setBusy(false);
                go("done");
              } else if (body?.reason === "taken") {
                await loadAvailability();
                setBusy(false);
                setSlot(null);
                setError("That time was just taken. Please pick another.");
                go("pick");
              } else {
                setBusy(false);
                setError("We couldn't book that. Please try again.");
              }
            }}
          >
            <div className="flex flex-col">
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
                Additional notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything that will help us prepare."
                className={cn(FIELD, "flex-1 resize-none")}
              />
            </div>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {busy ? "Booking" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => go("pick")}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center p-10 text-center lg:h-full">
            <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
              <motion.circle
                cx="32"
                cy="32"
                r="29"
                fill="none"
                strokeWidth="3"
                className="stroke-emerald-500"
                initial={{ pathLength: 0, rotate: -90 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
                style={{ transformOrigin: "center" }}
              />
              <motion.path
                d="M20 33l8 8 16-17"
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-emerald-500"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.75 }}
              />
            </svg>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.95 }}>
              <h3 className="mt-6 text-2xl font-medium tracking-tight">You&apos;re booked.</h3>
              <p className="mt-2 text-base text-muted-foreground">
                A confirmation will be sent to <span className="font-medium text-foreground">{info.email}</span>.
              </p>
              <ul className="mx-auto mt-6 w-fit space-y-3 text-left text-sm font-medium">{detailItems}</ul>
            </motion.div>
          </div>
        )}
      </motion.div>
      </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
