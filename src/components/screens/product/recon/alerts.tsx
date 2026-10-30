"use client";

/**
 * Recon alerts (Beta), set up on a loop in the app's alerts modal
 * (`recon-alerts-modal.tsx`): the empty list, New alert, the name typed, Jack
 * added to the Young County the map was showing, Daily picked from the
 * frequency menu, Save, and the saved alert in the list. Then the email that
 * alert sends, written by the app's own `reconAlertEmail`, slides in beside
 * it. The saved row and the email are the one alert in
 * `recon-alerts-fixture.ts`.
 *
 * The frequency menu is drawn in the canvas (`DemoMenu`): the app's Select
 * portals out of the scaled screen.
 */
import { useEffect, useRef, useState } from "react";
import { ReconAlertsModal } from "@/components/scout/recon-alerts-modal";
import { reconAlertEmailHtml, reconAlerts } from "@/lib/screens/recon-alerts-fixture";
import { YOUNG_COUNTY } from "@/lib/screens/recon-fixture";
import { ScreenPanel } from "../../panel";
import { useDemoActive } from "../../demo-active";
import { DemoCursor, centreOf, type CursorPoint } from "./cursor";
import { DemoMenu, byText, rectOf, typeInto, type CanvasRect } from "./demo-ui";

type Cursor = (CursorPoint & { down: boolean }) | null;
type Menu = { anchor: CanvasRect; hover: string | null };

interface Ctx {
  scene: HTMLElement | null;
  setCursor: (c: Cursor | ((c: Cursor) => Cursor)) => void;
  setMenu: (m: Menu | null | ((m: Menu | null) => Menu | null)) => void;
  setEmail: (on: boolean) => void;
}
type Step = { id: string; hold: number; run: (c: Ctx) => void | (() => void) };

const FREQUENCIES = [
  { v: "daily", label: "Daily" },
  { v: "weekly", label: "Weekly (Fridays)" },
];

const aim = (c: Ctx, el: Element | null | undefined) => {
  const p = centreOf(el);
  if (p) c.setCursor({ ...p, down: false });
};
const press = (c: Ctx) => c.setCursor((p) => (p ? { ...p, down: true } : p));
const click = (c: Ctx, el: HTMLElement | null | undefined) => {
  press(c);
  el?.click();
};
const nameInput = (c: Ctx) => c.scene?.querySelector<HTMLInputElement>('input[maxlength="120"]');
const countyInput = (c: Ctx) => c.scene?.querySelector<HTMLInputElement>('input[placeholder="Search county…"]');
const frequency = (c: Ctx) => c.scene?.querySelector('[data-slot="select-trigger"]');

const STEPS: Step[] = [
  {
    id: "list",
    hold: 1800,
    run: (c) => {
      c.setCursor(null);
      c.setMenu(null);
      c.setEmail(false);
    },
  },
  { id: "toNew", hold: 900, run: (c) => aim(c, byText(c.scene, "button", "New alert")) },
  { id: "form", hold: 1100, run: (c) => click(c, byText(c.scene, "button", "New alert")) },
  { id: "toName", hold: 800, run: (c) => aim(c, nameInput(c)) },
  {
    id: "name",
    hold: 1900,
    run: (c) => {
      press(c);
      return typeInto(nameInput(c), reconAlerts[0].name, 85);
    },
  },
  { id: "toCounty", hold: 800, run: (c) => aim(c, countyInput(c)) },
  {
    id: "county",
    hold: 1000,
    run: (c) => {
      press(c);
      return typeInto(countyInput(c), "Jac");
    },
  },
  { id: "aimJack", hold: 800, run: (c) => aim(c, byText(c.scene, "ul button", "Jack")) },
  { id: "jack", hold: 1000, run: (c) => click(c, byText(c.scene, "ul button", "Jack")) },
  { id: "toFrequency", hold: 800, run: (c) => aim(c, frequency(c)) },
  {
    id: "frequencyMenu",
    hold: 900,
    run: (c) => {
      press(c);
      const anchor = rectOf(frequency(c));
      if (anchor) c.setMenu({ anchor, hover: null });
    },
  },
  {
    id: "aimWeekly",
    hold: 800,
    run: (c) => {
      c.setMenu((m) => (m ? { ...m, hover: "weekly" } : m));
      aim(c, c.scene?.querySelector('[data-demo-item="weekly"]'));
    },
  },
  {
    id: "aimDaily",
    hold: 700,
    run: (c) => {
      c.setMenu((m) => (m ? { ...m, hover: "daily" } : m));
      aim(c, c.scene?.querySelector('[data-demo-item="daily"]'));
    },
  },
  {
    id: "daily",
    hold: 700,
    run: (c) => {
      press(c);
      c.setMenu(null);
    },
  },
  { id: "toSave", hold: 900, run: (c) => aim(c, byText(c.scene, "button", "Save")) },
  { id: "saved", hold: 1600, run: (c) => click(c, byText(c.scene, "button", "Save")) },
  {
    id: "email",
    hold: 7000,
    run: (c) => {
      c.setCursor(null);
      c.setEmail(true);
    },
  },
];

export function ReconAlertsScreen() {
  const active = useDemoActive();
  const [step, setStep] = useState(0);
  const [loop, setLoop] = useState(0);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [email, setEmail] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const s = STEPS[step];
    let cleanup: void | (() => void);
    const frame = requestAnimationFrame(() => {
      cleanup = s.run({ scene: root.current, setCursor, setMenu, setEmail });
    });
    const id = setTimeout(() => {
      // A new loop starts on a fresh modal: the empty list.
      if (step === STEPS.length - 1) setLoop((n) => n + 1);
      setStep((i) => (i + 1) % STEPS.length);
    }, s.hold);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(id);
      cleanup?.();
    };
  }, [active, step]);

  return (
    <ScreenPanel w={1280} h={720} path="/recon">
      <div ref={root} data-phase={STEPS[step].id} className="relative h-full">
        <div
          className={`absolute inset-y-0 left-0 flex items-center transition-[width] duration-700 ease-[cubic-bezier(.22,.61,.36,1)] ${
            email ? "w-[620px]" : "w-full px-24"
          }`}
        >
          <div className="flex h-[36rem] w-full flex-col overflow-hidden rounded-md bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10">
            <ReconAlertsModal key={loop} open inline onClose={() => {}} currentCounties={[YOUNG_COUNTY]} initialAlerts={[]} />
          </div>
        </div>
        <div
          className={`absolute inset-y-0 right-0 w-[560px] overflow-hidden rounded-md bg-white ring-1 ring-foreground/10 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.22,.61,.36,1)] ${
            email ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-16 opacity-0"
          }`}
        >
          <iframe title="Recon alert email" srcDoc={reconAlertEmailHtml()} className="h-full w-full border-0" />
        </div>
      </div>
      {menu && (
        <DemoMenu anchor={menu.anchor} items={FREQUENCIES} value="daily" hover={menu.hover} minWidth={176} />
      )}
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}
