"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeftIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAiDrawer } from "@/lib/ai/use-ai-drawer";

/*
 * ---------------------------------------------------------------------------
 * WHICH MODAL IS ON TOP - a registry of the open instances, in opening order.
 * ---------------------------------------------------------------------------
 *
 * Each modal paints its own dim + blur, and those COMPOUND. Two stacked make
 * the page 75% black instead of 50%, three make it 87.5% and blur the blur; on
 * Scout, where a well opens a lease opens an operator, the map disappears.
 *
 * So exactly one backdrop is painted at a time: the topmost open one. The rest
 * stay in the DOM (they still animate, and they still hold their card up) but
 * render transparent, and they are fully covered by the top one anyway.
 *
 * It is a module-level stack rather than a context because these modals do not
 * nest in the tree - Scout renders its three as siblings and lets state decide
 * which are open - so there is no provider that could see all of them.
 *
 * The same stack answers Escape. Every open modal binds its own key handler, so
 * without this one keypress closed the whole pile instead of peeling one layer.
 *
 * It also answers the header. The topbar's account cluster stays live while a
 * modal is open (see `SwipeUpModalHeaderShade`), so the header needs to know
 * when to shade itself and what a click on that shade should dismiss.
 */
/*
 * landing: the registry below is one PER CANVAS rather than one for the page.
 * The home page draws several product screens at once, each with its own
 * header; a modal opening in one of them must shade that screen's header
 * only. `ModalScope` (mounted by the screen frame) hands each canvas its own
 * stack and header rectangle; outside any scope the module's own is used.
 */
interface Registry {
  openModals: symbol[];
  listeners: Set<() => void>;
  dismissers: Map<symbol, () => void>;
  headerRect: HeaderRect | null;
  headerListeners: Set<() => void>;
}
function createRegistry(): Registry {
  return {
    openModals: [],
    listeners: new Set(),
    dismissers: new Map(),
    headerRect: null,
    headerListeners: new Set(),
  };
}
const defaultRegistry = createRegistry();
const ModalScopeContext = createContext<Registry>(defaultRegistry);

/** One modal stack and header for everything inside: one per product screen. */
export function ModalScope({ children }: { children: React.ReactNode }) {
  const [registry] = useState(createRegistry);
  return <ModalScopeContext.Provider value={registry}>{children}</ModalScopeContext.Provider>;
}

function notify(reg: Registry) {
  for (const l of reg.listeners) l();
}
function pushModal(reg: Registry, id: symbol) {
  if (reg.openModals.includes(id)) return;
  reg.openModals.push(id);
  syncScrollLock(reg);
  notify(reg);
}
function dropModal(reg: Registry, id: symbol) {
  const i = reg.openModals.indexOf(id);
  if (i === -1) return;
  reg.openModals.splice(i, 1);
  syncScrollLock(reg);
  notify(reg);
}

/*
 * landing: the app locks the page's scroll while a modal is open. The demo's
 * modals live inside a canvas on a page that must keep scrolling, so nothing
 * is locked here.
 */
function syncScrollLock(reg: Registry) {
  void reg;
}
function subscribeModals(reg: Registry, cb: () => void) {
  reg.listeners.add(cb);
  return () => {
    reg.listeners.delete(cb);
  };
}
/** Identity, not index: it is compared against this instance's own id. */
function topModal(reg: Registry): symbol | null {
  return reg.openModals[reg.openModals.length - 1] ?? null;
}
function anyModalOpen(reg: Registry): boolean {
  return reg.openModals.length > 0;
}
/** What a click on the top modal's backdrop does: back a step, or close. */
function dismissTop(reg: Registry) {
  const top = topModal(reg);
  if (top) reg.dismissers.get(top)?.();
}

/*
 * ---------------------------------------------------------------------------
 * THE HEADER STAYS LIVE - the backdrop is cut around the app header.
 * ---------------------------------------------------------------------------
 *
 * The account cluster at the header's right (voice, Orion, alerts, account)
 * keeps working while a modal is up, so a reader can open Orion beside the
 * form they are filling in or check an alert without closing it. The header
 * is a sticky stacking context the modal's layers cannot reach into, so the
 * backdrop leaves the header's own rectangle uncovered (only that, not the
 * whole top strip: the sidebar's logo beside the header stays covered), and
 * the header paints that missing piece of dim itself
 * (`SwipeUpModalHeaderShade`) with the cluster lifted above it. The card is
 * unchanged: it still paints over the header where a tall one reaches it, as
 * it always did.
 *
 * The gap is made of separate rectangles (the page below the header, the
 * strip beside it) rather than one backdrop with a `clip-path` notch. A
 * backdrop filter blurs everything inside the element's BOX and clips the
 * result afterwards, so a notched backdrop still fed the header's bright
 * pixels into the blur and bled them out as a pale band under the header.
 * Each rectangle blurs only what is under it.
 *
 * The header reports its own rectangle here rather than the modal assuming
 * one, so the sidebar collapsing (which moves the header's left edge), the
 * help docs' taller header, and a page with no header at all (the /dev
 * previews) all get a backdrop that meets whatever is actually there.
 */
type HeaderRect = { left: number; right: number; bottom: number };
function setHeaderRect(reg: Registry, next: HeaderRect | null) {
  const cur = reg.headerRect;
  if (
    next === cur ||
    (next && cur && next.left === cur.left && next.right === cur.right && next.bottom === cur.bottom)
  ) {
    return;
  }
  reg.headerRect = next;
  for (const l of reg.headerListeners) l();
}
function subscribeHeader(reg: Registry, cb: () => void) {
  reg.headerListeners.add(cb);
  return () => {
    reg.headerListeners.delete(cb);
    // The last header gone (route change into a header-less page) hands the
    // full viewport back to the backdrop.
    if (reg.headerListeners.size === 0) setHeaderRect(reg, null);
  };
}
function readHeaderRect(reg: Registry) {
  return reg.headerRect;
}

/**
 * The header's share of the modal backdrop. Rendered inside the app header,
 * which must be `relative`: it fills the header with the same dim + blur the
 * backdrop paints below it, fades on the same curve, and a click on it does
 * what a backdrop click does. Siblings that should stay usable sit above it
 * with `relative z-20`; everything else in the header falls under it.
 *
 * It also measures the header for the backdrop (see `headerRect` above).
 */
export function SwipeUpModalHeaderShade() {
  const reg = useContext(ModalScopeContext);
  const subscribe = useCallback((cb: () => void) => subscribeModals(reg, cb), [reg]);
  const open = useSyncExternalStore(subscribe, () => anyModalOpen(reg), () => false);
  const probe = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const header = probe.current?.parentElement;
    if (!header) return;
    const measure = () => {
      // landing: the header sits in a canvas scaled with a transform, and the
      // backdrop's rectangles are laid out inside that same canvas, so the
      // rectangle is reported in the canvas's own pixels: viewport distances
      // from the canvas's corner, divided by the scale the canvas renders at.
      const rect = header.getBoundingClientRect();
      const canvas = header.closest<HTMLElement>("[data-screen-canvas]");
      if (!canvas) {
        setHeaderRect(reg, { left: rect.left, right: rect.right, bottom: rect.bottom });
        return;
      }
      const c = canvas.getBoundingClientRect();
      const scale = c.width / canvas.offsetWidth || 1;
      setHeaderRect(reg, {
        left: (rect.left - c.left) / scale,
        right: (rect.right - c.left) / scale,
        bottom: (rect.bottom - c.top) / scale,
      });
    };
    measure();
    // Register as a header for as long as this is mounted, so unmounting the
    // last one resets the inset.
    const unsubscribe = subscribeHeader(reg, () => {});
    if (typeof ResizeObserver === "undefined") return unsubscribe;
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [reg]);

  return (
    <>
      <span ref={probe} hidden />
      <AnimatePresence>
        {open ? (
          <motion.div
            key="header-shade"
            data-slot="modal-header-shade"
            variants={BACKDROP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => dismissTop(reg)}
            // One pixel past the bottom: `inset-0` stops at the padding box,
            // and the header's hairline border below it would stay bright.
            className="absolute inset-0 -bottom-px z-10 bg-black/50 backdrop-blur-sm"
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

/*
 * ---------------------------------------------------------------------------
 * THE MOTION - the same curve the GSAP version drew, in framer-motion terms.
 * ---------------------------------------------------------------------------
 *
 * These beziers are the GSAP eases this replaced, so the modal moves exactly as
 * it always has: the card rises on a quart-out over half a second and drops back
 * on a faster quart-in, while the backdrop fades on a cubic-out under it. Both
 * tweens start together, which is what makes the dim read as the card's own
 * shadow arriving rather than a separate curtain.
 *
 * The card's variant names are driven from its parent layer, so one
 * `AnimatePresence` decides mount and unmount for the pair.
 */
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;
const EASE_IN_QUART = [0.895, 0.03, 0.685, 0.22] as const;
const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;
const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;

/** One rectangle of the backdrop; the tint is what `isTop` toggles. */
/**
 * landing: every modal renders in place. The canvas the screens draw in is a
 * transformed element, which makes it the containing block for `fixed`
 * descendants, so the backdrop and card fill the canvas rather than the page.
 */
const IN_PLACE = true;
function portalOrInPlace(node: React.ReactNode) {
  return IN_PLACE ? node : createPortal(node, document.body);
}

const BACKDROP_PIECE = "pointer-events-auto absolute transition-colors duration-300";
const BACKDROP_TINT = "bg-black/50 backdrop-blur-sm";

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0, transition: { duration: 0.25, ease: EASE_OUT_QUAD } },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT_CUBIC } },
};

const CARD_VARIANTS = {
  hidden: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.35, ease: EASE_IN_QUART },
  },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_OUT_QUART },
  },
};

/** The title bar: Back, title + description, header action, Close. */
function ModalHeader({
  title,
  description,
  headerAction,
  onBack,
  onClose,
}: {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          className="-ml-2 shrink-0"
          onClick={onBack}
        >
          <ChevronLeftIcon />
        </Button>
      ) : null}
      <div className="mr-auto flex flex-col gap-0.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {headerAction}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}

/**
 * A bottom-anchored card that swipes up into a vertically-centered position,
 * over a darkened + blurred backdrop. Rendered via a portal so the fixed
 * overlay escapes the page's query-container.
 *
 * Safe to stack: see the registry above for what the second and third one do.
 */
export function SwipeUpModal({
  open,
  onClose,
  title,
  description,
  className,
  headerAction,
  onBack,
  elevated = false,
  inline = false,
  inlineHeader = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
  /** Optional control rendered in the header, left of the close button. */
  headerAction?: React.ReactNode;
  /**
   * A step back, for modals that stack (Recon's dossiers). When set, a Back
   * button sits at the header's left, and Escape and a backdrop click go back
   * one step instead of calling `onClose`, which then means "close them all".
   */
  onBack?: () => void;
  /** Raise above another SwipeUpModal (for a stacked/nested modal) so its
   * backdrop dims + blurs the modal beneath it. */
  elevated?: boolean;
  /**
   * Render the content in place - no portal, backdrop, or title bar.
   *
   * This is what lets a form that IS a modal everywhere else (tank settings,
   * well info) be a TAB inside another surface without a second copy of the
   * form existing. The host supplies the frame and the heading; the form keeps
   * its fields, its draft state, and its submit row.
   */
  inline?: boolean;
  /**
   * With `inline`: keep the title bar (title, description, header action,
   * Back and Close). For a host that gives the dossier a frame but not a
   * heading, such as Recon's Browse pane, where the content IS the pane.
   */
  inlineHeader?: boolean;
  children: React.ReactNode;
}) {
  // Held true from the moment it opens until the exit animation has finished,
  // so the portal exists for the whole closing tween and nothing is in the DOM
  // outside it. Starting false is also what keeps the portal off the server.
  const [mounted, setMounted] = useState(false);
  // One identity per instance, for as long as it lives. State rather than a
  // ref because it is read during render, to compare against the stack's top.
  const [id] = useState(() => Symbol("swipe-up-modal"));

  // Registered on `open`, not on `mounted`: a modal playing its closing
  // animation is on the way out and must hand the backdrop over immediately.
  const reg = useContext(ModalScopeContext);
  useEffect(() => {
    if (open && !inline) pushModal(reg, id);
    else dropModal(reg, id);
    return () => dropModal(reg, id);
  }, [open, inline, id, reg]);

  // Fresh every render, so the header shade dismisses with the current
  // callbacks; dropped with the modal.
  useEffect(() => {
    reg.dismissers.set(id, onBack ?? onClose);
    return () => {
      reg.dismissers.delete(id);
    };
  }, [id, onBack, onClose, reg]);

  const subscribeH = useCallback((cb: () => void) => subscribeHeader(reg, cb), [reg]);
  const header = useSyncExternalStore(subscribeH, () => readHeaderRect(reg), () => null);

  const subscribeM = useCallback((cb: () => void) => subscribeModals(reg, cb), [reg]);
  const isTop =
    useSyncExternalStore(subscribeM, () => topModal(reg), () => null) === id;

  /*
   * ORION STAYS USABLE. The modal is the task and Orion is the copilot you
   * read it with - a permit on Recon, a tank's history, a well's settings - so
   * when the drawer is open the backdrop stops at its left edge instead of
   * blurring the thing you are typing into. The header's Orion button stays
   * live while a modal is up (see the header shade above), so this is also
   * what makes pressing it mid-modal worth anything.
   *
   * An inset, not a z-index: `backdrop-filter` blurs whatever is behind the
   * element's own BOX, so the only way to leave the drawer sharp is to not
   * cover it. That also leaves it clickable, and keeps a click on it from
   * hitting the backdrop's dismiss handler. The inset is the drawer's RENDERED
   * width, reported by the drawer itself frame by frame as it opens, closes or
   * is dragged, so the edge sits exactly on the drawer at every frame rather
   * than running a second tween that can drift from the first.
   */
  const rightInset = useAiDrawer((s) => s.renderedWidth);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- landing: app code as shipped
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    // Only the top of the stack answers Escape, so one press peels one layer
    // instead of dismissing every modal underneath it too.
    if (!open || !isTop) {
      return;
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        (onBack ?? onClose)();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, isTop, onClose, onBack]);

  // Inline: no portal, no mount/exit animation, and not on the modal stack -
  // the host owns the frame, the backdrop, and Escape.
  if (inline) {
    return open ? (
      <div className="flex min-h-0 flex-1 flex-col">
        {inlineHeader ? (
          <ModalHeader
            title={title}
            description={description}
            headerAction={headerAction}
            onBack={onBack}
            onClose={onClose}
          />
        ) : null}
        {children}
      </div>
    ) : null;
  }

  if (!mounted) {
    return null;
  }

  return portalOrInPlace(
    // One presence for the pair, so the portal is torn down once - on
    // `onExitComplete` - after BOTH the card and its backdrop have left.
    // The two are siblings rather than a wrapped pair because AnimatePresence
    // tracks its DIRECT children by key; a fragment around them would be one
    // unkeyed child and neither would ever play its exit.
    <AnimatePresence
      onExitComplete={() => {
        // Re-checked because a modal reopened mid-close must survive the
        // finishing tween's callback rather than be torn out from under it.
        if (!open) setMounted(false);
      }}
    >
      {/* Tinted only while this is the top modal. The transition matters: the
          outgoing tint fades out over the same 300ms the incoming one fades
          in, so the two cross rather than leaving a bright gap. Crossing peaks
          at ~0.44 combined alpha against a steady 0.5, so the page never gets
          darker than a single backdrop - which is the whole point. */}
      {open ? (
        <motion.div
          key="backdrop"
          data-slot="modal-backdrop"
          variants={BACKDROP_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onBack ?? onClose}
          style={{ right: rightInset }}
          // The layer itself is only a frame: the dim is on the rectangles,
          // which is where a click has to land to dismiss. The header's
          // rectangle has nothing in it, so a click there reaches the header.
          className={cn(
            "pointer-events-none fixed inset-0",
            elevated ? "z-[110]" : "z-[100]"
          )}
        >
          {/* The page below the header. */}
          <div
            data-slot="modal-backdrop-below"
            style={{ top: header?.bottom ?? 0 }}
            className={cn(BACKDROP_PIECE, "inset-x-0 bottom-0", isTop ? BACKDROP_TINT : "bg-transparent")}
          />
          {/* The strip beside the header, either side: the sidebar's top on
              the left, and whatever is right of it when the header stops
              short of the frame. */}
          {header ? (
            <>
              <div
                data-slot="modal-backdrop-beside"
                style={{ width: header.left, height: header.bottom }}
                className={cn(BACKDROP_PIECE, "top-0 left-0", isTop ? BACKDROP_TINT : "bg-transparent")}
              />
              <div
                data-slot="modal-backdrop-beside"
                style={{ left: header.right, height: header.bottom }}
                className={cn(BACKDROP_PIECE, "top-0 right-0", isTop ? BACKDROP_TINT : "bg-transparent")}
              />
            </>
          ) : null}
        </motion.div>
      ) : null}
      {open ? (
        <motion.div
          key="card"
          initial="hidden"
          animate="visible"
          exit="hidden"
          // Centred in what is LEFT of the viewport: a card centred on the
          // whole of it would sit half under the drawer it just made usable.
          style={{ right: rightInset }}
          className={cn(
            "pointer-events-none fixed inset-0 flex items-center justify-center p-4",
            elevated ? "z-[111]" : "z-[101]"
          )}
        >
          {/* This layer is only a position; the card is what moves, so its
              100% is its own height rather than the viewport's. It takes the
              variant NAMES from the layer above, which is how one presence
              drives a child that is not its direct subject. */}
          <motion.div
            variants={CARD_VARIANTS}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "pointer-events-auto flex max-h-[90%] w-full max-w-md flex-col overflow-hidden rounded-md bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10",
              className
            )}
          >
            <ModalHeader
              title={title}
              description={description}
              headerAction={headerAction}
              onBack={onBack}
              onClose={onClose}
            />
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
  );
}
