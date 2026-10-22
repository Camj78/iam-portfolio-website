"use client";

import { useEffect } from "react";
import type { ScrollCraftInstance } from "@/vendor/scrollcraft/scrollcraft";
import { land, rememberScroll } from "@/lib/landing";

/** Mounts the unmodified Scroll Craft engine once the server markup is hydrated, then lands any #hash or restored position. */
export function ScrollCraftMount() {
  useEffect(() => {
    let api: ScrollCraftInstance | undefined;
    let gone = false;
    let unland: (() => void) | undefined;
    const unremember = rememberScroll();
    import("@/vendor/scrollcraft/scrollcraft.js").then(() => {
      if (!gone && window.ScrollCraft) { api = window.ScrollCraft.mount(document); unland = land(); }
    });
    return () => { gone = true; unremember(); unland?.(); api?.destroy(); };
  }, []);
  return null;
}
