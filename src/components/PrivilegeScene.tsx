"use client";

import { useEffect, useRef } from "react";
import { AU, beats, tokens, PHASE1_PAGE, PHASE1_REPO } from "@/content/privilege-scene";

/*
  Privilege: control the boundary (CFG Phase 1).

  One pinned Scroll Craft act (span 6). The engine pins the stage, publishes
  progress p as --sc-p, fades the beat captions (data-sc-cue, kinetic titles)
  and drifts the dust (data-sc-parallax). This component maps the same p onto
  a camera over a 3D tenant floor:

    0.00  Two identities. The admin identity lifts away from the workforce one.
    0.10  The camera rises; the CFG tenant floor tilts into view.
    0.17  User Administrator attaches. Its reach (the beam) covers the tenant.
    0.40  AU-New York is drawn, its walls rise, and the reach contracts inside.
    0.60  PIM: the assignment turns eligible, the beam goes from solid to dashed.
    0.73  The emergency-access case slides in, apart from the floor.
    0.88  Who, what, how, where: each control is labeled. Links to Phase 1.

  Reduced motion and no-JS: no pin. The final composition with every caption
  listed beside it.
*/

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Pt = [number, number];

/** Opening positions (% of stage) and the CSS resting positions they settle to. */
const OPEN = {
  desktop: { workforce: [64, 50], wfEnd: [44, 89], stack: [82, 28], stEnd: [70, 11], scale: 1.3 },
  mobile: { workforce: [36, 46], wfEnd: [27, 91], stack: [62, 53], stEnd: [60, 41], scale: 1.08 },
  compact: { workforce: [36, 58], wfEnd: [27, 92], stack: [62, 70], stEnd: [60, 50], scale: 1 },
};

/** Convex hull (monotone chain) so the beam is one clean shape from any angle. */
function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [], upper: Pt[] = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

export function PrivilegeScene() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current!;
    const st = section.querySelector<HTMLElement>(".pv__stage")!;
    const q = <T extends Element = HTMLElement>(s: string) => st.querySelector(s) as T;
    const qa = <T extends Element = HTMLElement>(s: string) => Array.from(st.querySelectorAll<T & Element>(s)) as T[];

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) section.removeAttribute("data-sc-act");
    else section.setAttribute("data-live", "");

    const small = matchMedia("(max-width: 860px)");
    const short = matchMedia("(max-width: 860px) and (max-height: 700px)");
    const visual = section.querySelector<HTMLElement>(".pv__visual")!;
    const el = {
      room: q(".pv__room"),
      world: q(".pv__world"),
      floor: q(".pv__floor"),
      lit: q(".pv__lit"),
      au: q(".pv__au"),
      workforce: q(".pv__card--workforce"),
      stack: q(".pv__stack"),
      role: q(".pv__chip--role"),
      pim: q(".pv__chip--pim"),
      tags: qa(".pv__tag"),
      vault: q(".pv__vault"),
      fg: qa(".pv__fg-orb"),
      head: q(".pv__head"),
      end: q(".pv__end"),
      beam: q<SVGSVGElement>(".pv__beam"),
      beamFill: q<SVGPolygonElement>(".pv__beam-fill"),
      beamEdge: q<SVGPolygonElement>(".pv__beam-edge"),
      floorCorners: qa(".pv__corner--floor"),
      auCorners: qa(".pv__corner--au"),
    };

    let target = reduce ? 1 : 0, current = -1, raf = 0, dead = false;
    let top = 0, travel = 1, W = 1, H = 1;

    const measure = () => {
      // The visual box: the whole stage when pinned, its own column when static.
      W = visual.clientWidth; H = visual.clientHeight;
      top = section.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, section.offsetHeight - innerHeight);
    };

    // Projected corners from the last painted frame. Read before any write, so
    // the beam never forces a synchronous layout.
    const centre = (e: Element, o: DOMRect): Pt => {
      const r = e.getBoundingClientRect();
      return [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top];
    };

    const apply = (p: number) => {
      const mobile = small.matches;
      const o = visual.getBoundingClientRect();
      const fc = el.floorCorners.map((c) => centre(c, o));
      const ac = el.auCorners.map((c) => centre(c, o));
      const sr = el.stack.getBoundingClientRect();

      // --- beats ------------------------------------------------------------
      const lift = ease(seg(p, 0.05, 0.18));
      const tilt = ease(seg(p, 0.08, 0.3));
      const roleIn = easeOut(seg(p, 0.15, 0.24));
      const reachT = seg(p, 0.19, 0.28);
      const border = seg(p, 0.38, 0.45);
      const walls = ease(seg(p, 0.42, 0.56));
      const k = ease(seg(p, 0.44, 0.57));         // reach contracts to AU-New York
      const dolly = ease(seg(p, 0.4, 0.57));
      const pim = ease(seg(p, 0.6, 0.69));
      const vault = ease(seg(p, 0.72, 0.84));
      const end = easeOut(seg(p, 0.88, 0.95));

      // --- camera -----------------------------------------------------------
      const tiltDeg = lerp(74, mobile ? 54 : 57, tilt);
      const yawDeg = lerp(-3, mobile ? -10 : -14, tilt);
      el.floor.style.setProperty("--tilt", `${tiltDeg.toFixed(2)}deg`);
      el.floor.style.setProperty("--yaw", `${yawDeg.toFixed(2)}deg`);
      el.floor.style.setProperty("--wall-k", walls.toFixed(4));
      el.floor.style.opacity = lerp(0.6, 1, seg(p, 0.06, 0.24)).toFixed(3);
      // Dolly toward the boundary, then pan left to make room for the case.
      const pan = (mobile ? 0 : -0.09 * W) * vault * (1 - 0.45 * end);
      const towardAU = (mobile ? -0.05 : -0.035) * W * dolly;
      const ws = lerp(0.9, 1, tilt) * lerp(1, mobile ? 1.1 : 1.13, dolly) * lerp(1, 0.95, end);
      el.world.style.transform = `translate3d(${(towardAU + pan).toFixed(1)}px,${(lerp(0.06, 0, tilt) * H).toFixed(1)}px,0) scale(${ws.toFixed(4)})`;
      el.world.style.opacity = (1 - (mobile ? 0.7 : 0.25) * vault * (1 - end * (mobile ? 0.6 : 1))).toFixed(3);

      // Room: the far plane, barely moves.
      el.room.style.transform = `translate3d(${(pan * 0.2).toFixed(1)}px,${(-p * 0.04 * H).toFixed(1)}px,0) scale(${(1.04 + 0.04 * dolly).toFixed(4)})`;

      // Reach: everyone lit (tenant-wide), then only AU-New York.
      el.floor.dataset.reach = reachT < 0.5 ? "none" : k < 0.5 ? "tenant" : "au";
      el.lit.style.opacity = reachT.toFixed(3);
      el.lit.style.clipPath = `inset(${(AU.y * k).toFixed(2)}% ${((100 - AU.x - AU.w) * k).toFixed(2)}% ${((100 - AU.y - AU.h) * k).toFixed(2)}% ${(AU.x * k).toFixed(2)}% round ${(k * 10).toFixed(1)}px)`;
      el.au.style.setProperty("--draw", border.toFixed(3));

      // --- identities -------------------------------------------------------
      // Opening: the two identities side by side, large. Then the admin identity
      // lifts to command the floor and the workforce one settles onto it.
      const A = short.matches ? OPEN.compact : mobile ? OPEN.mobile : OPEN.desktop;
      const wfFrom = (A.workforce[0] - A.wfEnd[0]) / 100 * W, wfFromY = (A.workforce[1] - A.wfEnd[1]) / 100 * H;
      const stFrom = (A.stack[0] - A.stEnd[0]) / 100 * W, stFromY = (A.stack[1] - A.stEnd[1]) / 100 * H;
      el.workforce.style.transform =
        `translate3d(${((1 - lift) * wfFrom).toFixed(1)}px,${((1 - lift) * wfFromY).toFixed(1)}px,0) scale(${lerp(A.scale, 0.86, lift).toFixed(4)})`;
      el.workforce.style.opacity = lerp(1, 0.6, lift).toFixed(3);
      el.stack.style.transform =
        `translate3d(${((1 - lift) * stFrom + pan * 0.6).toFixed(1)}px,${((1 - lift) * stFromY).toFixed(1)}px,0) scale(${lerp(A.scale, 1, lift).toFixed(4)})`;
      el.role.style.opacity = roleIn.toFixed(3);
      el.role.style.transform = `translate3d(${((1 - roleIn) * 36).toFixed(1)}px,0,0)`;
      el.pim.style.opacity = pim.toFixed(3);
      el.pim.style.transform = `translate3d(${((1 - pim) * 36).toFixed(1)}px,0,0)`;
      el.tags.forEach((t) => { t.style.opacity = end.toFixed(3); });

      // --- beam: role reach, from the admin stack down to its scope ----------
      const tgt = fc.map((f, i) => [lerp(f[0], ac[i][0], k), lerp(f[1], ac[i][1], k)] as Pt);
      const cx = sr.left + sr.width / 2 - o.left, by = sr.bottom - o.top - 6, half = sr.width * 0.18;
      const shape = hull([[cx - half, by], [cx + half, by], ...tgt]).map((v) => v.map((n) => n.toFixed(1)).join(",")).join(" ");
      el.beamFill.setAttribute("points", shape);
      el.beamEdge.setAttribute("points", shape);
      const beamOn = reachT * (1 - 0.35 * vault);
      el.beam.style.opacity = beamOn.toFixed(3);
      el.beamFill.style.opacity = lerp(1, 0.32, pim).toFixed(3);
      el.beam.toggleAttribute("data-eligible", pim > 0.5);

      // --- emergency access: a separate case, its own fast plane -------------
      el.vault.style.opacity = vault.toFixed(3);
      el.vault.style.transform = mobile
        ? `translate(-50%,-50%) translate3d(0,${((1 - vault) * 0.45 * H).toFixed(1)}px,0) scale(${lerp(1, 0.78, end).toFixed(4)})`
        : `translate(-50%,-50%) perspective(1000px) translate3d(${((1 - vault) * 0.4 * W).toFixed(1)}px,0,0) rotateY(${lerp(-34, -14, vault).toFixed(2)}deg)`;

      // Foreground: out-of-focus figures at the lens.
      el.fg.forEach((f, i) => {
        const rate = [1.1, 0.75, 1.4][i % 3];
        f.style.transform = `translate3d(${(pan * 1.8).toFixed(1)}px,${(-(p - 0.5) * H * rate).toFixed(1)}px,0)`;
      });

      // --- copy (pinned only: the static layout shows every caption) --------
      if (reduce) return;
      const headOut = seg(p, 0.12, 0.17);
      el.head.style.opacity = (1 - headOut).toFixed(3);
      el.head.style.transform = `translate3d(0,${(-headOut * 24).toFixed(1)}px,0)`;
      el.end.style.opacity = end.toFixed(3);
      el.end.style.transform = `translate3d(0,${((1 - end) * 20).toFixed(1)}px,0)`;
      el.end.style.pointerEvents = end > 0.5 ? "auto" : "none";
    };

    const frame = () => {
      raf = 0;
      if (dead) return;
      const next = current < 0 ? target : current + (target - current) * 0.16;
      const settled = Math.abs(next - target) < 0.0003;
      current = settled ? target : next;
      apply(current);
      // The beam reads last frame's geometry: one extra frame lets it catch up.
      if (!settled) raf = requestAnimationFrame(frame);
      else requestAnimationFrame(() => { if (!dead) apply(current); });
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const onResize = () => { measure(); current = -1; kick(); };
    if (reduce) {
      // Static composition: draw the final state once, and again on resize.
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
    const onFocus = (e: FocusEvent) => {
      if (!el.end.contains(e.target as Node)) return;
      measure();
      window.scrollTo({ top: top + 0.96 * travel, behavior: "instant" });
    };

    measure(); onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    small.addEventListener("change", onResize);
    section.addEventListener("focusin", onFocus);
    document.fonts?.ready.then(() => { if (!dead) onResize(); });

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
    <section ref={root} id="privilege" className="pv" data-sc-act="pin" data-sc-span="6" data-ground="dark"
      aria-labelledby="privilege-title">
      {/* Where "Scope is where." holds on the timeline (p ≈ 0.5). */}
      <span id="scope" className="pv__anchor" aria-hidden="true" />

      <div className="pv__stage" data-sc-stage>
        {/* ------------------------------------------------ the visual */}
        <div className="pv__visual" aria-hidden="true">
          {/* L0 · room */}
          <div className="pv__room" />
          <div className="pv__dust" data-sc-parallax="-0.8" />

          {/* L1 + L2 · the tenant floor and the AU-New York walls (true 3D) */}
          <div className="pv__world">
            <div className="pv__floor" data-reach="au">
              <div className="pv__lit" />
              <span className="pv__floor-label">CFG tenant · Microsoft Entra ID</span>
              {tokens.map((t, i) => (
                <span key={i} className="pv__tok" data-au={t.au ? "" : undefined} data-id={t.id}
                  style={{ left: `${t.u}%`, top: `${t.v}%` }}>
                  <i>{t.id === "jennifer" && <b className="pv__tok-label">Jennifer Parker</b>}</i>
                </span>
              ))}
              <div className="pv__au" style={{ left: `${AU.x}%`, top: `${AU.y}%`, width: `${AU.w}%`, height: `${AU.h}%` }}>
                <span className="pv__wall pv__wall--n" />
                <span className="pv__wall pv__wall--s" />
                <span className="pv__wall pv__wall--w" />
                <span className="pv__wall pv__wall--e" />
                <span className="pv__au-label">
                  <span className="pv__tag">Where</span>AU-New York
                </span>
                <span className="pv__corner pv__corner--au" style={{ left: 0, top: 0 }} />
                <span className="pv__corner pv__corner--au" style={{ left: "100%", top: 0 }} />
                <span className="pv__corner pv__corner--au" style={{ left: "100%", top: "100%" }} />
                <span className="pv__corner pv__corner--au" style={{ left: 0, top: "100%" }} />
              </div>
              <span className="pv__corner pv__corner--floor" style={{ left: 0, top: 0 }} />
              <span className="pv__corner pv__corner--floor" style={{ left: "100%", top: 0 }} />
              <span className="pv__corner pv__corner--floor" style={{ left: "100%", top: "100%" }} />
              <span className="pv__corner pv__corner--floor" style={{ left: 0, top: "100%" }} />
            </div>
          </div>

          {/* L3 · the role's reach */}
          <svg className="pv__beam">
            <defs>
              <linearGradient id="pv-beam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgb(102 199 147)" stopOpacity="0.26" />
                <stop offset="1" stopColor="rgb(102 199 147)" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <polygon className="pv__beam-fill" fill="url(#pv-beam)" />
            <polygon className="pv__beam-edge" />
          </svg>

          {/* L4 · identities */}
          <div className="pv__card pv__card--workforce">
            <span className="pv__mark pv__mark--workforce" />
            <span className="pv__card-text"><strong>Marcus Reed</strong><span>Workforce · daily work</span></span>
          </div>
          <div className="pv__stack">
            <div className="pv__card pv__card--admin">
              <span className="pv__tag">Who</span>
              <span className="pv__mark pv__mark--admin" />
              <span className="pv__card-text"><strong>Marcus Reed (Admin)</strong><span>Privileged identity</span></span>
            </div>
            <div className="pv__chip pv__chip--role">
              <span className="pv__tag">What</span>
              <span className="pv__chip-mark" />User Administrator <em>Built-in role</em>
            </div>
            <div className="pv__chip pv__chip--pim">
              <span className="pv__tag">How</span>
              <span className="pv__chip-mark pv__chip-mark--pim" />PIM <em>Eligible</em>
            </div>
          </div>

          {/* L5 · emergency access, sealed apart */}
          <div className="pv__vault">
            <span className="pv__vault-label">Emergency access</span>
            <div className="pv__ea"><span className="pv__mark pv__mark--ea" /><strong>EA-01</strong></div>
            <div className="pv__ea"><span className="pv__mark pv__mark--ea" /><strong>EA-02</strong></div>
            <span className="pv__vault-foot">Global Administrator · recovery only</span>
          </div>

          {/* L6 · foreground */}
          <span className="pv__fg-orb pv__fg-orb--1" />
          <span className="pv__fg-orb pv__fg-orb--2" />
          <span className="pv__fg-orb pv__fg-orb--3" />
        </div>

        {/* ------------------------------------------------ the copy */}
        <div className="pv__copy">
          <p className="pv__kicker mono">Privilege · CFG Phase 1</p>
          <header className="pv__head">
            <h2 id="privilege-title" className="pv__title">Privilege.</h2>
            <p className="pv__lede">
              Control the boundary. Privileged work runs on a separate admin identity, not the everyday account.
            </p>
          </header>
          <ol className="pv__beats">
            {beats.map((b) => (
              <li key={b.title} className="pv__beat" data-sc-cue={b.cue}>
                <h3 className="pv__beat-title">{b.title}</h3>
                <p className="pv__beat-body">{b.body}</p>
              </li>
            ))}
          </ol>
          <div className="pv__end">
            <p className="pv__recap" aria-hidden="true">Role is what.<br /><span>Scope is where.</span></p>
            <div className="pv__links">
              <a className="btn btn--solid" href={PHASE1_PAGE}>Full Phase 1 case study</a>
              <a className="pv__gh" href={PHASE1_REPO} target="_blank" rel="noopener noreferrer">
                Evidence on GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
