# WildcatIQ Landing - Style Guide

This landing page borrows the WildcatIQ webapp's design language so the two feel
like one product. The single deliberate difference is **theme**: the **app is
light**, the **landing is dark**. Everything else - fonts, radii, spacing
rhythm, component shapes, neutral-grayscale palette - stays as close to the app
as possible.

> Source of truth for the app: `wildcat-webapp/src/app/globals.css` and
> `wildcat-webapp/src/components/ui/*`. When in doubt, match the app.

---

## 1. Principles

- **Neutral, not colorful.** The brand is a grayscale system. Color appears only
  as small functional accents (status pills), never as decorative gradients or
  brand hues. The hero's only "color" is a soft neutral radial glow.
- **Dark mirror of the app.** Where the app uses a light surface with dark text,
  the landing uses a near-black surface with light text. Borders that are
  black/10 in the app become **white/10** here.
- **Quiet motion.** Subtle only - the particle field, hover opacity shifts, color
  transitions. No bouncy or attention-grabbing animation.
- **One typographic exception:** the hero headline uses the **mono** font as a
  display face (an intentional landing-only choice). Everything else uses the
  app's sans. See §3.

---

## 2. Color

Dark palette (`src/app/globals.css`). Values are deliberately deeper than the
app's `.dark` theme to give the marketing page more drama, but they sit on the
same neutral grayscale ramp.

| Token | Value | Use | App equivalent |
|---|---|---|---|
| `--background` / `bg-background` | `#000000` | Page background | `--background` (dark) |
| `--foreground` / `text-foreground` | `#f5f5f5` | Primary text, solid buttons fill | `--foreground` (dark) |
| `--muted` / `text-muted` | `#8a8f98` | Secondary / supporting text, nav links | `--muted-foreground` |
| `--card` / `bg-card` | `white/2%` | Elevated surface fill (cards) | `--card` |
| `--border` / `border-border` | `white/10%` | Hairline borders, dividers | `--border` (dark) |

**Accent / functional color** (use sparingly, app convention - only for status):

| Meaning | Classes |
|---|---|
| Success / active | `bg-emerald-500/10 text-emerald-400` |
| Warning / low | `bg-amber-500/10 text-amber-400` |
| Info / on-order | `bg-blue-500/10 text-blue-400` |
| Neutral / default | `bg-white/5 text-muted` |

**Surface conventions**

- Solid CTA: `bg-foreground text-background` (inverts to a light button on dark).
- Subtle surface: `bg-white/[0.02]` with `border border-white/10`.
- Featured/elevated surface: `bg-white/[0.04]` with `border border-white/25`.
- Card outline (app parity): `ring-1 ring-foreground/10` is equivalent to the
  app's card ring; `border border-white/10` is the simpler landing default.

---

## 3. Typography

Fonts match the app (`src/app/layout.tsx`):

- **Sans / headings:** `Figtree` → `font-sans` (= `--font-heading` in the app).
- **Mono:** `Geist Mono` → `font-mono`.

### The hero exception
The hero headline uses **mono, medium weight**, large, tight leading - a
landing-only display treatment:

```
font-mono text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl
```

Keep mono **only** for the hero display headline (and the pricing page's matching
H1). Do not spread mono into body copy, nav, or section headings.

### Everything else (app parity)
The app's headings are Figtree, semibold/medium, tight tracking. Use these:

| Role | Classes | Notes |
|---|---|---|
| Section H2 | `font-mono text-lg font-medium tracking-tight` | Mono is used for small section titles on the landing for rhythm with the hero; switch to `font-sans font-semibold` if you want stricter app parity. |
| Page H1 (non-hero) | `font-mono text-4xl font-medium tracking-tight sm:text-5xl` | e.g. pricing page |
| Card title | `font-sans text-base font-medium leading-snug` | Mirrors app `CardTitle` |
| Body | `text-base text-muted` (supporting) / `text-foreground` (primary) | App body is 14px (`text-sm`); landing runs a touch larger for marketing. |
| Small / label | `text-sm font-medium` | |
| Caption / meta | `text-xs text-muted` | |

Tracking: headings use `tracking-tight`. Weights: prefer `font-medium` /
`font-semibold`; avoid `font-bold` for the large mono display (it's too heavy at
size - medium is the chosen look).

---

## 4. Radius

Ported from the app (10px base, `src/app/globals.css`):

| Class | Value | Use |
|---|---|---|
| `rounded-md` | 8px | Tiny chips, inline tags |
| `rounded-lg` | 10px | **Buttons, inputs, controls** (app default) |
| `rounded-xl` | 14px | **Cards, panels** |
| `rounded-full` | - | Badges/pills, avatars, status dots |

> **Pills vs. rectangles:** per the app and an explicit decision on this page,
> buttons and nav actions are **rounded rectangles** (`rounded-lg`), *not* full
> pills. `rounded-full` is reserved for small status badges and dots.

---

## 5. Buttons

Base shape: `inline-flex items-center justify-center rounded-lg font-semibold transition`.

| Variant | Classes | Use |
|---|---|---|
| **Primary** | `rounded-lg bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90` | Main CTA (Get started, Sign up) |
| **Outline / secondary** | `rounded-lg border border-white/15 text-foreground px-4 py-2 text-sm font-semibold hover:bg-white/5` | Secondary action (Sign in) |
| **Ghost** | `rounded-lg text-muted px-3 py-2 text-sm font-medium hover:text-foreground hover:bg-white/5` | Low-emphasis / nav |

Sizes (height via padding, app uses `h-8`/`h-9` - landing runs slightly larger):

- Default: `px-4 py-2 text-sm`
- Large (hero CTA): `px-5 py-2.5 text-base`

Icon-in-button: trailing arrow at `h-4 w-4`, `gap-2` (default) / `gap-2.5` (large).
Keep the solid CTA hover as `hover:opacity-90` (the app uses `hover:bg-primary/80`
- same intent, opacity is fine on the inverted dark button).

---

## 6. Cards & surfaces

Mirror the app's card (`rounded-xl`, subtle fill, hairline outline):

```html
<div class="rounded-xl border border-white/10 bg-white/[0.02] p-6">…</div>
```

- Featured card: `border-white/25 bg-white/[0.04]`.
- Internal padding: `p-6` for marketing cards (app cards use `p-4`; larger here
  for breathing room).
- Title inside card: `font-mono text-lg font-medium tracking-tight` (or
  `font-sans` for strict parity).

---

## 7. Badges & pills

App pattern, adapted to dark:

```html
<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-foreground text-background">
  Most popular
</span>
```

Status dot variant:

```html
<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400">
  <span class="size-1.5 rounded-full bg-current"></span> Active
</span>
```

---

## 8. Spacing & layout rhythm

From the app's section rhythm:

| Token | Use |
|---|---|
| `gap-10` | Between major sections / nav clusters |
| `gap-6` | Between content blocks within a section |
| `gap-4` | Between grouped items |
| `gap-2` / `gap-1.5` | Dense controls, inline icon + text |

Containers:

- Page max width: `max-w-7xl` with `px-6 lg:px-10`.
- Hero headline measure: `max-w-5xl`.
- Body copy measure: `max-w-3xl`.
- Navbar height: `h-20` (app uses `h-14`; landing nav is roomier).

Z-layering for the particle backdrop: `Particles` at `z-0`, content wrapper at
`z-10`, header at `z-20`.

---

## 9. Icons

- Library: keep to **lucide**-style line icons (the app uses `lucide-react`).
  The landing currently uses small hand-rolled SVGs in
  `src/components/icons.tsx` drawn in the same line style - match their look
  (`fill-none`, `stroke-current`, `stroke-width 1.5`, round caps/joins) if adding
  more.
- Default size: `h-5 w-5` for inline feature icons, `h-4 w-4` inside buttons
  (app default is `size-4` = 16px).
- Stroke weight: `1.5`. Round line caps and joins.

---

## 10. Motion

- **Particle field** (`src/components/ui/particles.tsx`): ported verbatim from the
  app's auth page. On the dark landing use `color="#888888"`, `quantity≈140`,
  `ease=20`.
- **Hover:** solid surfaces `hover:opacity-90`; subtle surfaces
  `hover:bg-white/5`; text `transition-colors` to `text-foreground`.
- **Glow:** hero uses a single neutral radial:
  `bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(120,130,160,0.12),transparent_60%)]`.
- Durations: default Tailwind (~150ms). Keep it quiet.

---

## 11. Do / Don't

**Do**
- Reuse `bg-foreground text-background` for primary CTAs.
- Keep borders at `white/10`, surfaces at `white/2–4%`.
- Use `tracking-tight` on headings.
- Reserve mono for the hero/pricing display headline.

**Don't**
- Don't use full-pill buttons - rounded rectangles only.
- Don't introduce brand colors or gradients beyond the neutral glow.
- Don't use `font-bold` on the large mono display (use `font-medium`).
- Don't spread mono into body, nav, or card copy.
