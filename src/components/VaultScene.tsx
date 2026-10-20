"use client";

import { useEffect, useRef, useState } from "react";
import { vault, learning, next, demonstratedCount, casePage, type Evidence } from "@/content/vault-scene";

/*
  Validation: the evidence vault.

  One pinned Scroll Craft act (span 6). The engine pins the stage, publishes p
  as --sc-p, fades the captions (data-sc-cue) and drifts the dust
  (data-sc-parallax). This component flies a CSS 3D camera through it:

    0.00  A security corridor. Light strips run to a round vault door.
    0.08  Dolly down the corridor; the door's ring turns, the halves part.
    0.30  Through the door into the chamber: eleven evidence panels hang in an
          arc around the camera, dim and locked.
    0.46  Verify: the camera turns across the arc and each capability group
          lights in turn, revealing its redacted screenshot.
    0.80  Pull back: Demonstrated (lit), Learning (outlined, no evidence) and
          Next (empty slots) side by side.

  Every lit panel is a button: it opens the redacted screenshot, the CFG case
  study and the GitHub documentation. Reduced motion and no-JS: no pin; the
  final chamber beside every caption.
*/

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Geometry per breakpoint, px. P perspective, D corridor depth, R arc radius, C chamber centre past the door. */
const GEO = {
  desktop: { P: 1000, D: 2600, R: 900, C: 820, spread: 21, back: 700 },
  mobile: { P: 760, D: 2100, R: 760, C: 700, spread: 26, back: 640 },
};

/** When each group lights, in order around the arc. */
const LIGHT_AT = [0.47, 0.53, 0.59, 0.65, 0.71];

type Key = [number, number, number, number]; // p, camera distance into the vault (0..1 of path), yaw, pitch
function keys(p: number, list: Key[]): [number, number, number] {
  for (let i = 1; i < list.length; i++) {
    const [p1, z1, y1, x1] = list[i], [p0, z0, y0, x0] = list[i - 1];
    if (p <= p1) { const t = ease(seg(p, p0, p1)); return [lerp(z0, z1, t), lerp(y0, y1, t), lerp(x0, x1, t)]; }
  }
  const l = list[list.length - 1];
  return [l[1], l[2], l[3]];
}

/** Arc slots: each group at an angle; its items staggered in angle, height and depth. */
const STAGGER: Record<number, [number, number, number][]> = {
  2: [[-4, -0.56, 0], [4, 0.56, 90]],
  3: [[-7, -0.6, 0], [7, -0.6, 80], [0, 0.62, 40]],
};

export function VaultScene() {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<{ e: Evidence; group: string } | null>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  useEffect(() => {
    const section = root.current!;
    const visual = section.querySelector<HTMLElement>(".ev__visual")!;
    const q = <T extends Element = HTMLElement>(s: string) => section.querySelector(s) as T;
    const qa = <T extends Element = HTMLElement>(s: string) => Array.from(section.querySelectorAll(s)) as T[];

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) section.removeAttribute("data-sc-act");
    else section.setAttribute("data-live", "");
    const small = matchMedia("(max-width: 860px)");

    const el = {
      world: q(".ev__world"),
      corridor: q(".ev__corridor"),
      ring: q(".ev__door-ring"),
      label: q(".ev__door-label"),
      halfL: q(".ev__door-half--l"),
      halfR: q(".ev__door-half--r"),
      flood: q(".ev__flood"),
      chamber: q(".ev__chamber"),
      groups: qa(".ev__group"),
      shelf: q(".ev__shelf"),
      fg: qa(".ev__fg"),
      head: q(".ev__head"),
      end: q(".ev__end"),
    };

    let target = reduce ? 1 : 0, current = -1, raf = 0, dead = false;
    let top = 0, travel = 1;

    const measure = () => {
      const G = small.matches ? GEO.mobile : GEO.desktop;
      top = section.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, section.offsetHeight - innerHeight);
      visual.style.setProperty("--P", `${G.P}px`);
      visual.style.setProperty("--D", `${G.D}px`);
      visual.style.setProperty("--R", `${G.R}px`);
      visual.style.setProperty("--C", `${G.C}px`);
      visual.style.setProperty("--back", `${G.back}px`);
      // Set here, not derived in CSS: a custom property resolves where it is
      // declared, so a CSS calc on .ev would keep the desktop depths.
      visual.style.setProperty("--zc", `${-(G.D + G.C)}px`);
      // Place each panel on the arc around the chamber centre.
      el.groups.forEach((g, gi) => {
        // Group 0 on the left, reading order matches lighting order.
        const a = ((el.groups.length - 1) / 2 - gi) * G.spread;
        g.style.setProperty("--a", `${a}deg`);
        const items = Array.from(g.querySelectorAll<HTMLElement>(".ev__panel"));
        const st = STAGGER[items.length] ?? STAGGER[2];
        items.forEach((it, i) => {
          const [da, dy, dz] = st[i];
          it.style.setProperty("--ia", `${da}deg`);
          it.style.setProperty("--iy", String(dy));
          it.style.setProperty("--iz", `${dz}px`);
        });
      });
    };

    const apply = (p: number) => {
      const mobile = small.matches;
      const G = mobile ? GEO.mobile : GEO.desktop;
      // Camera path, in px of travel into the vault, with yaw and pitch.
      const doorStop = G.D - (mobile ? 420 : 520);
      const centre = G.D + G.C + G.P;          // eye at the chamber centre
      const entry = centre - (mobile ? 260 : 380);
      const pull = centre - (mobile ? 520 : 760);
      // Turning to group i cancels its arc angle; edges stop a little short.
      const yaw = (i: number) => (i - 2) * G.spread * (mobile ? 1 : 0.8);
      const K: Key[] = [
        [0, 0, 0, 0], [0.07, 0, 0, 0],
        [0.24, doorStop, 0, 0], [0.29, doorStop, 0, 0],
        [0.42, entry, 0, -1],
        [0.47, centre, yaw(0), 0], [0.53, centre, yaw(1), 0], [0.59, centre, yaw(2), 0],
        [0.65, centre, yaw(3), 0], [0.73, centre, yaw(4), 0],
        // Final: pitch up so the arc rises above the legend row.
        [0.84, pull, 0, mobile ? -15 : -7], [1, pull, 0, mobile ? -15 : -7],
      ];
      const [z, yw, pitch] = keys(p, K);
      el.world.style.transform = `rotateX(${pitch.toFixed(2)}deg) rotateY(${yw.toFixed(2)}deg) translate3d(0,0,${z.toFixed(1)}px)`;

      // Door: the ring unlocks, then the halves slide into the walls.
      const unlock = ease(seg(p, 0.13, 0.21));
      const part = ease(seg(p, 0.2, 0.29));
      el.ring.style.transform = `rotate(${(unlock * 120).toFixed(2)}deg)`;
      el.halfL.style.transform = `translate3d(${(-part * 112).toFixed(2)}%,0,0)`;
      el.halfR.style.transform = `translate3d(${(part * 112).toFixed(2)}%,0,0)`;
      el.ring.style.opacity = (1 - seg(p, 0.19, 0.24)).toFixed(3);
      el.label.style.opacity = (1 - seg(p, 0.19, 0.24)).toFixed(3);
      el.flood.style.opacity = (part * (1 - seg(p, 0.3, 0.35))).toFixed(3);
      // Fades go on the surfaces, never on a 3D container: opacity on a
      // preserve-3d element flattens it and breaks occlusion.
      // The corridor is behind the lens once we are through: let it go.
      el.world.style.setProperty("--corr", (1 - seg(p, 0.33, 0.39)).toFixed(3));
      el.world.style.setProperty("--cham", lerp(0.35, 1, seg(p, 0.22, 0.36)).toFixed(3));

      // Groups light in sequence; once lit, they stay lit.
      el.groups.forEach((g, gi) => {
        const lit = seg(p, LIGHT_AT[gi], LIGHT_AT[gi] + 0.04);
        g.style.setProperty("--lit", easeOut(lit).toFixed(3));
        g.toggleAttribute("data-lit", lit > 0.5);
      });
      el.shelf.style.setProperty("--show", easeOut(seg(p, 0.78, 0.88)).toFixed(3));

      // Foreground: bulkhead ribs right at the lens, fastest plane.
      el.fg.forEach((f, i) => {
        const k = [1.6, 2.2][i % 2];
        f.style.transform = `translate3d(${(yw * -14 * k).toFixed(1)}px,0,0) scale(${(1 + seg(p, 0.08, 0.3) * 0.35 * k).toFixed(3)})`;
        f.style.opacity = (1 - seg(p, 0.26, 0.36)).toFixed(3);
      });

      if (reduce) return;
      const headOut = seg(p, 0.08, 0.12);
      el.head.style.opacity = (1 - headOut).toFixed(3);
      el.head.style.transform = `translate3d(0,${(-headOut * 20).toFixed(1)}px,0)`;
      const endIn = easeOut(seg(p, 0.82, 0.9));
      el.end.style.opacity = endIn.toFixed(3);
      el.end.style.transform = `translate3d(0,${((1 - endIn) * 18).toFixed(1)}px,0)`;
    };

    const frame = () => {
      raf = 0;
      if (dead) return;
      const nxt = current < 0 ? target : current + (target - current) * 0.14;
      const settled = Math.abs(nxt - target) < 0.0003;
      current = settled ? target : nxt;
      apply(current);
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const onResize = () => { measure(); current = -1; kick(); };

    if (reduce) {
      measure(); kick();
      addEventListener("resize", onResize, { passive: true });
      return () => { dead = true; cancelAnimationFrame(raf); removeEventListener("resize", onResize); };
    }

    let engineLive = false;
    const mo = new MutationObserver(() => {
      const v = parseFloat(section.style.getPropertyValue("--sc-p"));
      if (Number.isNaN(v)) return;
      engineLive = true; target = v; kick();
    });
    mo.observe(section, { attributes: true, attributeFilter: ["style"] });
    const onScroll = () => { if (!engineLive) { target = clamp01((scrollY - top) / travel); kick(); } };
    // Focus on anything inside the vault that is not on screen yet: go to the
    // resolved chamber, where every panel is lit and every link is visible.
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".ev__panel, .ev__end")) return;
      if (current > 0.8) return;
      measure();
      window.scrollTo({ top: top + 0.92 * travel, behavior: "instant" });
    };

    measure(); onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    small.addEventListener("change", onResize);
    section.addEventListener("focusin", onFocus);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      mo.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      small.removeEventListener("change", onResize);
      section.removeEventListener("focusin", onFocus);
      section.removeAttribute("data-live");
    };
  }, []);

  return (
    <section ref={root} id="validation" className="ev" data-sc-act="pin" data-sc-span="6" data-ground="dark"
      aria-labelledby="validation-title">
      <div className="ev__stage" data-sc-stage>
        <div className="ev__visual">
          <div className="ev__space" aria-hidden="true" />
          <div className="ev__dust" data-sc-parallax="-0.8" aria-hidden="true" />

          <div className="ev__world">
            {/* L1 · the corridor: four real planes running to the door */}
            <div className="ev__corridor" aria-hidden="true">
              <span className="ev__plane ev__plane--floor" />
              <span className="ev__plane ev__plane--ceiling" />
              <span className="ev__plane ev__plane--left" />
              <span className="ev__plane ev__plane--right" />
              <div className="ev__bulkhead">
                <div className="ev__door">
                  <span className="ev__door-half ev__door-half--l" />
                  <span className="ev__door-half ev__door-half--r" />
                  <span className="ev__door-ring"><i /><i /><i /><i /><i /><i /></span>
                  <span className="ev__door-label">CFG evidence</span>
                </div>
              </div>
            </div>
            <div className="ev__flood" aria-hidden="true" />

            {/* L2 · the chamber, and the evidence on an arc around the camera */}
            <div className="ev__chamber">
              <span className="ev__chamber-floor" aria-hidden="true" />
              <span className="ev__chamber-wall" aria-hidden="true" />
              <ul className="ev__arc" aria-label="Demonstrated capabilities with CFG evidence">
                {vault.map((g) => (
                  <li key={g.id} className="ev__group">
                    <span className="ev__group-label" aria-hidden="true">{g.label}</span>
                    {g.items.map((e) => (
                      <button key={e.id} type="button" className="ev__panel"
                        aria-label={`${e.title}. ${g.label}, CFG Phase ${e.phase}. Open evidence.`}
                        onClick={() => setOpen({ e, group: g.label })}>
                        <span className="ev__thumb" aria-hidden="true">
                          {e.shots[0] ? (
                            <img src={e.shots[0].src} alt="" width={e.shots[0].w} height={e.shots[0].h} loading="lazy" decoding="async" />
                          ) : (
                            <span className="ev__thumb-none">Evidence on GitHub</span>
                          )}
                        </span>
                        <span className="ev__panel-meta" aria-hidden="true">Phase {e.phase} · {g.label}</span>
                        <span className="ev__panel-title" aria-hidden="true">{e.title}</span>
                      </button>
                    ))}
                  </li>
                ))}
              </ul>

              {/* Learning and Next: on the back wall, never lit */}
              <div className="ev__shelf">
                <div className="ev__tier ev__tier--learning">
                  <span className="ev__tier-label">Learning · SC-300 study</span>
                  <ul>{learning.map((l) => <li key={l}><span>In study</span>{l}</li>)}</ul>
                </div>
                <div className="ev__tier ev__tier--next">
                  <span className="ev__tier-label">Next · planned labs</span>
                  <ul>{next.map((l) => <li key={l}><span>Planned</span>{l}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>

          {/* L4 · foreground bulkhead ribs */}
          <span className="ev__fg ev__fg--l" aria-hidden="true" />
          <span className="ev__fg ev__fg--r" aria-hidden="true" />
        </div>

        <div className="ev__copy">
          <p className="ev__kicker mono">Validation · CFG evidence</p>
          <header className="ev__head">
            <h2 id="validation-title" className="ev__title">Validation.</h2>
            <p className="ev__lede">The evidence vault. Only completed CFG lab work is stored here.</p>
          </header>
          <ol className="ev__beats">
            <li className="ev__beat" data-sc-cue="0.3 0.45 0.25">
              <h3 className="ev__beat-title">{demonstratedCount} capabilities. Each one on file.</h3>
              <p className="ev__beat-body">Grouped by what they prove, from CFG Phase 1 and Phase 2.</p>
            </li>
            <li className="ev__beat" data-sc-cue="0.46 0.79 0.14">
              <h3 className="ev__beat-title">Verify the work.</h3>
              <p className="ev__beat-body">Select a lit panel for the redacted screenshot, the case study and the GitHub source.</p>
            </li>
          </ol>
          <div className="ev__end">
            <ul className="ev__legend">
              <li data-tier="demonstrated"><b>Demonstrated</b><span>{demonstratedCount}</span><em>Completed CFG lab evidence</em></li>
              <li data-tier="learning"><b>Learning</b><span>{learning.length}</span><em>SC-300 study, not yet built</em>
                <small>{learning.join(" · ")}</small></li>
              <li data-tier="next"><b>Next</b><span>{next.length}</span><em>Planned hands-on labs</em>
                <small>{next.join(" · ")}</small></li>
            </ul>
            <p className="ev__rule">Nothing moves up a tier without evidence.</p>
          </div>
        </div>
      </div>

      <dialog ref={dialog} className="ev__dialog" aria-labelledby="ev-dialog-title"
        onClose={() => setOpen(null)}
        onClick={(ev) => { if (ev.target === dialog.current) dialog.current?.close(); }}>
        {open && (
          <div className="ev__sheet">
            <header className="ev__sheet-head">
              <p className="mono">CFG Phase {open.e.phase} · {open.group}</p>
              <button type="button" className="ev__close" onClick={() => dialog.current?.close()} aria-label="Close evidence">×</button>
            </header>
            <h3 id="ev-dialog-title" className="ev__sheet-title">{open.e.title}</h3>
            <p className="ev__sheet-claim">{open.e.claim}</p>
            {open.e.shots.length > 0 ? (
              <>
                <div className="ev__shots">
                  {open.e.shots.map((s) => (
                    <figure key={s.src}>
                      <img src={s.src} alt={s.alt} width={s.w} height={s.h} />
                    </figure>
                  ))}
                </div>
                <p className="ev__redacted mono">Redacted copy · admin account, tenant domain and browser bar hidden</p>
              </>
            ) : (
              <p className="ev__noshot">No preview on this site. The screenshots are documented in the CFG repository.</p>
            )}
            <div className="ev__sheet-links">
              <a className="btn btn--solid" href={casePage(open.e.phase)}>Phase {open.e.phase} case study</a>
              <a className="ev__gh" href={open.e.github.href} target="_blank" rel="noopener noreferrer">
                {open.e.github.label} on GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
