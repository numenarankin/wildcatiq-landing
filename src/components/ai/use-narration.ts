"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NarrationState = "idle" | "loading" | "playing";

/**
 * Orion reading something long aloud - a whole report rather than one chat
 * answer.
 *
 * `useSpeech` synthesizes a message in a single request, which is right for a
 * paragraph and wrong here: a report script runs past the route's
 * `MAX_TTS_CHARS` cap and would be silently cut off mid-sentence. So the script
 * is split at sentence boundaries into clips.
 *
 * Time-to-first-word is what makes this feel fast or broken, and it is set by
 * how long the FIRST clip takes to synthesize - so the first clip is one
 * sentence, and the clips ramp up from there (a sentence, then a couple, then
 * paragraph-sized). Orion starts talking roughly as fast as he can say the
 * opening line, and the long clips that follow are being synthesized the whole
 * time he is speaking: the loop keeps two clips in flight ahead of playback, so
 * after the first one there is nothing left to wait for. Each request passes the
 * previous clip's text, which keeps prosody continuous across the seams.
 */

/**
 * Clip size caps, in characters, in order - short first so the voice starts
 * almost immediately, then growing to keep request count (and seams) down. The
 * last value repeats for the rest of the script; all are well under the route's
 * 5,000-character cap.
 */
const CLIP_RAMP = [140, 320, 700, 1200];

/** How many clips are kept synthesizing ahead of the one being played. */
const LOOK_AHEAD = 2;

/**
 * Split a script into clips at sentence boundaries, never mid-sentence, with the
 * first clips deliberately small (see {@link CLIP_RAMP}).
 */
export function toClips(script: string, ramp: number[] = CLIP_RAMP): string[] {
  const sentences = script.match(/[^.!?]+[.!?]+["')\]]?\s*/g) ?? [script];
  const clips: string[] = [];
  let current = "";
  const capFor = (index: number): number =>
    ramp[Math.min(index, ramp.length - 1)];

  for (const sentence of sentences) {
    const cap = capFor(clips.length);
    if (current && current.length + sentence.length > cap) {
      clips.push(current.trim());
      current = "";
    }
    current += sentence;
    // A single sentence longer than the cap still has to go somewhere.
    if (current.length >= capFor(clips.length)) {
      clips.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) clips.push(current.trim());
  return clips.filter(Boolean);
}

async function fetchClip(text: string, previousText?: string): Promise<Blob> {
  const res = await fetch("/api/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, previousText }),
  });
  if (!res.ok) throw new Error((await res.text()) || "Speech synthesis failed");
  return res.blob();
}

export function useNarration() {
  const [state, setState] = useState<NarrationState>("idle");
  const [error, setError] = useState<string | null>(null);
  // Bumped on every stop; an in-flight clip checks it and bails, so a late
  // response can't restart audio the user already stopped.
  const runRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<string[]>([]);

  const stop = useCallback(() => {
    runRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setState("idle");
  }, []);

  // Never leave audio playing behind a page the user has navigated away from.
  useEffect(() => stop, [stop]);

  const play = useCallback(
    async (script: string) => {
      stop();
      const run = runRef.current;
      const clips = toClips(script);
      if (clips.length === 0) return;

      setError(null);
      setState("loading");
      try {
        // Synthesis runs ahead of playback: `pending[i]` is either already
        // resolved or in flight by the time clip i is reached, so only the first
        // (deliberately short) clip is ever actually waited on.
        const pending: (Promise<Blob> | undefined)[] = [];
        const request = (i: number): void => {
          if (i >= clips.length || pending[i]) return;
          const clip = fetchClip(clips[i], i > 0 ? clips[i - 1] : undefined);
          // A look-ahead clip can reject long before it is awaited; swallow it
          // here (the awaiting `await` still sees the rejection) so it isn't
          // reported as an unhandled rejection.
          clip.catch(() => {});
          pending[i] = clip;
        };
        for (let i = 0; i <= LOOK_AHEAD; i++) request(i);

        for (let i = 0; i < clips.length; i++) {
          request(i);
          const blob = await pending[i]!;
          if (runRef.current !== run) return;
          // Top the queue back up before playing, not after: the fetches then
          // overlap this clip's playback instead of following it.
          for (let j = i + 1; j <= i + LOOK_AHEAD; j++) request(j);

          const url = URL.createObjectURL(blob);
          urlsRef.current.push(url);
          const audio = new Audio(url);
          audioRef.current = audio;
          setState("playing");
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error("Playback failed"));
            audio.play().catch(reject);
          });
          if (runRef.current !== run) return;
        }
        if (runRef.current === run) stop();
      } catch (err) {
        if (runRef.current !== run) return;
        console.error("Narration failed", err);
        setError(err instanceof Error ? err.message : "Narration failed");
        stop();
      }
    },
    [stop]
  );

  return { state, error, play, stop };
}
