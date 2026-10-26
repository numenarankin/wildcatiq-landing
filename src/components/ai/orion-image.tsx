"use client";

// The app loads a generated picture from storage. No image blocks in the fixture.
import type { ImageBlock } from "@/lib/ai/image-blocks";

export function OrionImage({ block }: { block: ImageBlock }) {
  void block;
  return null;
}
