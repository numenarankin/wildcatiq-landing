"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The office address field, with Mapbox Search Box suggestions as the visitor
 * types (admin docs/plans/demo-booking.md, "Landing changes"). Picking one
 * fills the full address and hands back its coordinates; typing over it drops
 * them, and a typed address is geocoded by admin instead.
 */

export interface PickedPlace {
  address: string;
  lat: number;
  lng: number;
}

interface Suggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
}

const API = "https://api.mapbox.com/search/searchbox/v1";
/** Bias toward the owner's base in Keller, TX. */
const PROXIMITY = "-97.25,32.93";
/** Texas's bounding box: demos are in Texas only, so suggestions are too. */
const TEXAS_BBOX = "-106.65,25.84,-93.51,36.5";
const MIN_CHARS = 3;
const DEBOUNCE_MS = 200;
const LIMIT = 4;

export function AddressInput({
  id,
  value,
  onChange,
  onPick,
  invalid,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (place: PickedPlace | null) => void;
  invalid?: boolean;
  className?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const listId = useId();
  // One search session per visit, as Mapbox bills suggest + retrieve.
  const [session] = useState(() => crypto.randomUUID());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = useRef("");
  const skipNext = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
    query.current = q;
    if (q.length < MIN_CHARS) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = new URL(`${API}/suggest`);
        url.search = new URLSearchParams({
          q,
          access_token: token,
          session_token: session,
          country: "us",
          language: "en",
          types: "address,poi",
          proximity: PROXIMITY,
          bbox: TEXAS_BBOX,
          limit: String(LIMIT),
        }).toString();
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) return;
        const body = (await res.json()) as { suggestions?: Suggestion[] };
        if (query.current !== q) return;
        setSuggestions(body.suggestions ?? []);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted or offline: the field still takes a typed address.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, token, session]);

  async function pick(s: Suggestion) {
    setOpen(false);
    const label = s.full_address ?? [s.name, s.place_formatted].filter(Boolean).join(", ");
    skipNext.current = true;
    onChange(label);
    try {
      const url = new URL(`${API}/retrieve/${encodeURIComponent(s.mapbox_id)}`);
      url.search = new URLSearchParams({ access_token: token!, session_token: session }).toString();
      const res = await fetch(url);
      if (!res.ok) return onPick(null);
      const body = (await res.json()) as { features?: { geometry?: { coordinates?: [number, number] }; properties?: { full_address?: string } }[] };
      const f = body.features?.[0];
      const c = f?.geometry?.coordinates;
      onPick(c ? { address: f?.properties?.full_address ?? label, lng: c[0], lat: c[1] } : null);
    } catch {
      onPick(null);
    }
  }

  const shown = open && value.trim().length >= MIN_CHARS ? suggestions : [];

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type="text"
        required
        autoComplete="off"
        placeholder="Where we should meet you"
        value={value}
        role="combobox"
        aria-expanded={shown.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          onPick(null);
          onChange(e.target.value);
        }}
        onBlur={() => setOpen(false)}
        onFocus={() => suggestions.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!shown.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % shown.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? shown.length - 1 : a - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(shown[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={className}
      />
      {shown.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-border bg-background py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {shown.map((s, i) => (
            <li
              key={s.mapbox_id}
              role="option"
              aria-selected={i === active}
              // Before blur, so the pick lands.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("cursor-pointer px-3.5 py-1.5", i === active && "bg-muted")}
            >
              <p className="truncate text-sm font-medium">{s.name}</p>
              {s.place_formatted && <p className="truncate text-xs text-muted-foreground">{s.place_formatted}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
