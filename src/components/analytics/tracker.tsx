"use client";

import { useEffect } from "react";
import { startTracking } from "@/lib/track/tracker";

/** Starts the behaviour tracker once per page load, on the live site only (`trackingAllowed`). */
export function Tracker() {
  useEffect(() => {
    startTracking();
  }, []);
  return null;
}
