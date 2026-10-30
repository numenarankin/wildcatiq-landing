"use client";

/**
 * Motion shared by the phone demos: a step clock that only runs while the
 * screen is on view, Reanimated's springs as CSS easing curves, and the iOS
 * keyboard the app's composers raise when they take focus.
 */
import { useEffect, useState } from "react";
import { Mic, Smile } from "lucide-react";
import { useDemoActive } from "../../demo-active";
import { C, SANS } from "./phone";

/**
 * Walks `durations` (ms per step) on a loop while the demo is on screen and
 * returns the current step's index.
 */
export function useStepLoop(durations: readonly number[]): number {
  const active = useDemoActive();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setI((n) => (n + 1) % durations.length), durations[i]);
    return () => clearTimeout(id);
  }, [active, i, durations]);
  return i;
}

/** How many times a step loop has come back round to step 0: a key that replays an arrival. */
export function useLoopCount(step: number): number {
  const [n, setN] = useState(0);
  const [prev, setPrev] = useState(step);
  if (step !== prev) {
    setPrev(step);
    if (step === 0) setN((x) => x + 1);
  }
  return n;
}

/** Counts 0..length at `ms` per tick while `running`, and resets to 0 when not. */
export function useTicker(running: boolean, length: number, ms: number, by = 1): number {
  const active = useDemoActive();
  const [n, setN] = useState(0);
  const [wasRunning, setWasRunning] = useState(running);
  if (running !== wasRunning) {
    setWasRunning(running);
    if (running) setN(0);
  }
  useEffect(() => {
    if (!active || !running || n >= length) return;
    const id = setTimeout(() => setN((x) => Math.min(length, x + by)), ms);
    return () => clearTimeout(id);
  }, [active, running, n, length, ms, by]);
  return running ? n : 0;
}

/**
 * A Reanimated `withSpring({ damping, stiffness, mass })` from 0 to 1 as a CSS
 * `linear()` easing and the time it takes to settle, by integrating the same
 * damped oscillator. `overshootClamping` clamps at the target, as Reanimated does.
 */
export function springCurve(cfg: { damping: number; stiffness: number; mass: number; overshootClamping?: boolean }): { easing: string; ms: number } {
  const dt = 1 / 600;
  let x = 0;
  let v = 0;
  const samples: number[] = [0];
  let t = 0;
  for (;;) {
    const a = (-cfg.stiffness * (x - 1) - cfg.damping * v) / cfg.mass;
    v += a * dt;
    x += v * dt;
    t += dt;
    if (cfg.overshootClamping && x >= 1) {
      x = 1;
      samples.push(1);
      break;
    }
    if (Math.round(t * 600) % 10 === 0) samples.push(x);
    // Reanimated's rest thresholds: displacement and speed both under 0.001.
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.001) {
      samples.push(1);
      break;
    }
  }
  const ms = Math.round(t * 1000);
  return { easing: `linear(${samples.map((s) => s.toFixed(4)).join(", ")})`, ms };
}

/** iOS's keyboard animation: 250 ms on its own ease. */
export const KEYBOARD_MS = 250;
export const KEYBOARD_EASE = "cubic-bezier(0.38, 0.7, 0.125, 1)";
/** The iPhone keyboard's height on a 390 x 844 screen, home-indicator strip included. */
export const KEYBOARD_H = 336;

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

function Key({ label, w, dark, pressed }: { label: React.ReactNode; w: number; dark?: boolean; pressed?: boolean }) {
  return (
    <div
      style={{
        width: w,
        height: 42,
        borderRadius: 5,
        background: pressed ? "#aeb3be" : dark ? "#abb0bc" : "#ffffff",
        boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SANS,
        fontSize: 22,
        color: C.foreground,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

/**
 * The system keyboard, drawn as iOS draws it: the QuickType bar on top, the
 * four rows of keys, and the emoji and dictation glyphs in the strip above
 * the home indicator. The device's chrome, like the status bar, not part of
 * the app. `pressKey` darkens the key being typed.
 */
export function IosKeyboard({ up, pressKey }: { up: boolean; pressKey?: string }) {
  const keyW = (390 - 6 - 9 * 6) / 10;
  const glyph: React.CSSProperties = { width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "#3c3c43" };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: KEYBOARD_H,
        background: "#d1d4db",
        transform: up ? "translateY(0)" : `translateY(${KEYBOARD_H}px)`,
        transition: `transform ${KEYBOARD_MS}ms ${KEYBOARD_EASE}`,
        // Under the home indicator, which iOS draws over the keyboard.
        zIndex: 35,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* QuickType */}
      <div style={{ height: 44, display: "flex", alignItems: "center" }}>
        {["the", "and", "it"].map((w, i) => (
          <div key={w} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: i > 0 ? "1px solid rgba(60,60,67,0.18)" : undefined, height: 24 }}>
            <span style={{ fontFamily: SANS, fontSize: 16, color: "#1c1c1e" }}>{w}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "4px 3px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {ROWS.map((row, r) => (
          <div key={r} style={{ display: "flex", justifyContent: "center", gap: 6 }}>
            {r === 2 ? <Key label="⇧" w={42} dark /> : null}
            {r === 2 ? <div style={{ width: 8 }} /> : null}
            {row.map((k) => (
              <Key key={k} label={k} w={keyW} pressed={pressKey === k} />
            ))}
            {r === 2 ? <div style={{ width: 8 }} /> : null}
            {r === 2 ? <Key label="⌫" w={42} dark /> : null}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          <Key label={<span style={{ fontSize: 16 }}>123</span>} w={88} dark />
          <Key label={<span style={{ fontSize: 16 }}>space</span>} w={186} pressed={pressKey === " "} />
          <Key label={<span style={{ fontSize: 16 }}>return</span>} w={88} dark />
        </div>
      </div>
      {/* emoji and dictation, over the home indicator's strip */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px 0" }}>
        <div style={glyph}>
          <Smile size={26} strokeWidth={1.6} />
        </div>
        <div style={glyph}>
          <Mic size={24} strokeWidth={1.6} />
        </div>
      </div>
    </div>
  );
}

/** turn-layers.tsx `Caret`: " |" swapping to transparent every 520 ms. */
export function BlinkCaret() {
  return (
    <span style={{ animation: "wc-caret 1040ms steps(1, end) infinite" }}>
      <style>{`@keyframes wc-caret { 0% { color: ${C.foreground}; } 50% { color: transparent; } }`}</style>
      {" |"}
    </span>
  );
}

/**
 * reanimated `FadeInDown`: opacity 0 to 1 while rising `rise` px (25 is its
 * default, turn-layers.tsx nudges 6), on withTiming's default inOut(quad).
 */
export function fadeInDown(ms: number, delay = 0, rise = 25): React.CSSProperties {
  return {
    animation: `wc-fade-in-down ${ms}ms cubic-bezier(0.455, 0.03, 0.515, 0.955) ${delay}ms both`,
    ["--wc-rise" as string]: `${rise}px`,
  };
}
export const FADE_KEYFRAMES = "@keyframes wc-fade-in-down { from { opacity: 0; transform: translateY(var(--wc-rise)); } to { opacity: 1; transform: none; } }";
