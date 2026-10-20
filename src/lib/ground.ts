export type Ground = "dark" | "paper" | "lounge";

/** Which chapter ground sits under viewport y. Chrome re-inks itself from this. */
export function groundAt(y: number, self?: Element | null): Ground {
  const els = document.querySelectorAll<HTMLElement>("section[data-ground]");
  for (const el of els) {
    if (el === self) continue;
    const b = el.getBoundingClientRect();
    if (b.top <= y && b.bottom >= y) return (el.dataset.ground as Ground) ?? "dark";
  }
  return "dark";
}
