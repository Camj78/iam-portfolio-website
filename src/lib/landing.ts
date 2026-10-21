/*
  Land direct #hash links and restored scroll positions on the page the engine builds.

  The server page is shorter than the live one: Scroll Craft gives the pinned acts their
  heights after mount (the Lounge alone grows by nine viewports). The browser scrolls to a
  #hash, or restores a refreshed or back-navigated position, against that short page, so
  anything below a growing act lands short. This re-applies the intended position once the
  engine has mounted and again on every later document resize, until the reader scrolls,
  touches, clicks or presses a key. Same-document jumps (the header's Contact link, back and
  forward between hashes) are left to the browser, which already gets them right.

  layout.tsx turns smooth scrolling off inline for these loads, so the browser does not glide
  through half-built acts first; landing hands it back.
*/

type Nav = { currentEntry?: { key?: string } | null };

function entryKey() {
  const nav = (window as unknown as { navigation?: Nav }).navigation;
  return `sc-y:${nav?.currentEntry?.key ?? location.href}`;
}

/**
  Remember where the reader is, per history entry, for a refresh or a return. The position comes
  from the last scroll event, not from scrollY at pagehide: by then the page can already be
  relaying out (a media-query flip mid-unload), and the reader never saw that position.
*/
export function rememberScroll() {
  let y = scrollY;
  const track = () => { y = scrollY; };
  const save = () => { try { sessionStorage.setItem(entryKey(), String(Math.round(y))); } catch {} };
  addEventListener("scroll", track, { passive: true });
  addEventListener("pagehide", save);
  return () => { removeEventListener("scroll", track); removeEventListener("pagehide", save); };
}

/** Call once the engine has mounted. Returns a cleanup. */
export function land() {
  const html = document.documentElement;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  let saved: number | null = null;
  if (nav && (nav.type === "reload" || nav.type === "back_forward")) {
    try { const v = sessionStorage.getItem(entryKey()); if (v !== null && Number.isFinite(+v)) saved = +v; } catch {}
  }
  let target: HTMLElement | null = null;
  if (saved === null && location.hash.length > 1) {
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch {}
  }

  const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
  let ro: ResizeObserver | null = null;
  const stop = () => {
    ro?.disconnect(); ro = null;
    inputs.forEach((t) => removeEventListener(t, stop, true));
    removeEventListener("hashchange", stop);
    html.style.removeProperty("scroll-behavior");
  };
  if (saved === null && !target) { stop(); return stop; }

  const align = () => {
    const goal = target ? target.getBoundingClientRect().top + scrollY : saved!;
    const y = Math.round(Math.max(0, Math.min(goal, html.scrollHeight - innerHeight)));
    if (Math.abs(scrollY - y) > 1) scrollTo({ top: y, behavior: "instant" });
  };
  inputs.forEach((t) => addEventListener(t, stop, { capture: true, passive: true }));
  addEventListener("hashchange", stop);
  ro = new ResizeObserver(align);
  ro.observe(document.body);
  align();
  return stop;
}
