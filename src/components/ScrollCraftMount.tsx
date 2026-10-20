"use client";

import { useEffect } from "react";
import type { ScrollCraftInstance } from "@/vendor/scrollcraft/scrollcraft";

/** Mounts the unmodified Scroll Craft engine once the server markup is hydrated. */
export function ScrollCraftMount() {
  useEffect(() => {
    let api: ScrollCraftInstance | undefined;
    let gone = false;
    import("@/vendor/scrollcraft/scrollcraft.js").then(() => {
      if (!gone && window.ScrollCraft) api = window.ScrollCraft.mount(document);
    });
    return () => { gone = true; api?.destroy(); };
  }, []);
  return null;
}
