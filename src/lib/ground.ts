export type Ground = "dark" | "paper" | "lounge";

/*
  Document geometry for the page chrome, cached.

  The header and the access-path rail re-ink themselves on every scroll frame.
  Reading getBoundingClientRect there, right after the scroll engine has
  written its styles, forced a synchronous style and layout pass of the whole
  3D page every frame. Section positions in the document only change when the
  page lays out again (resize, fonts, the engine sizing its acts), so measure
  them then and compare against scrollY on scroll.
*/

type Box = { top: number; bottom: number };
const boxes = new Map<Element, Box>();
let sections: { el: HTMLElement; ground: Ground }[] | null = null;
let watching = false;

function invalidate() { boxes.clear(); sections = null; }

function watch() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  addEventListener("resize", invalidate, { passive: true });
  addEventListener("load", invalidate);
  // Pinned acts get their heights from the engine after mount, and fonts can
  // reflow copy: any change to the document's size re-measures.
  new ResizeObserver(invalidate).observe(document.body);
}

/** An element's top and bottom in document coordinates (cached). */
export function docBox(el: Element): Box {
  watch();
  let b = boxes.get(el);
  if (!b) {
    const r = el.getBoundingClientRect();
    b = { top: r.top + scrollY, bottom: r.bottom + scrollY };
    boxes.set(el, b);
  }
  return b;
}

/** Which chapter ground sits under viewport y. Chrome re-inks itself from this. */
export function groundAt(y: number, self?: Element | null): Ground {
  watch();
  if (!sections) {
    sections = Array.from(document.querySelectorAll<HTMLElement>("section[data-ground]"))
      .map((el) => ({ el, ground: (el.dataset.ground as Ground) ?? "dark" }));
  }
  const Y = y + scrollY;
  for (const s of sections) {
    if (s.el === self) continue;
    const b = docBox(s.el);
    if (b.top <= Y && b.bottom >= Y) return s.ground;
  }
  return "dark";
}
