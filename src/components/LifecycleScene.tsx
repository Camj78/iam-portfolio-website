"use client";

import { useEffect, useRef } from "react";
import { people, stages, PHASE2_PAGE, PHASE2_REPO } from "@/content/lifecycle-scene";

/*
  Lifecycle: identity in motion (CFG Phase 2).

  One pinned Scroll Craft act using the engine's `pan` device (span 7): the
  engine pins the stage, publishes progress p as --sc-p, pans the far CFG
  skyline rail (data-sc-pan), fades the stage captions (data-sc-cue) and
  drifts the dust (data-sc-parallax). This component maps the same p onto a
  side-on camera that follows each test identity through the organization:

    0.00  Establishing shot: entrance, Finance, the group and the app.
    0.08  JOINER  Jonathan arrives, his attributes pass the Finance rule,
                  membership lights, the Finance Portal is inherited.
    0.35  MOVER   Sarah starts in Finance with the same access. Department
                  flips to Marketing; Finance membership and the inherited
                  app retract; the camera follows her to Marketing.
    0.64  LEAVER  Cut back to the entrance. David (contractor) fails the
                  employee-only rule, so there is no group link at all. The
                  account is disabled, the session link is cut, and he leaves.
    0.92  Pull back over the whole lifecycle. Links to Phase 2.

  Reduced motion and no-JS: no pin; the resolved wide shot beside every caption.
*/

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Camera keys: [p, x in zone units, zoom]. Eased between consecutive keys. */
type Key = [number, number, number];
const CAMERA: Record<"desktop" | "mobile", Key[]> = {
  desktop: [
    [0, 0.62, 0.9], [0.06, 0.62, 0.9], [0.15, 1, 1], [0.36, 1.06, 1], [0.47, 1.06, 1],
    [0.57, 2, 1], [0.63, 2, 1], [0.69, 0.55, 0.84], [0.8, 0.82, 0.84], [0.89, 2.72, 0.84],
    [0.96, 1.48, 0.5], [1, 1.48, 0.5],
  ],
  // The phone frame is narrow: the camera stays on whoever is acting.
  mobile: [
    [0, 0.7, 0.9], [0.06, 0.7, 0.9], [0.15, 0.97, 1], [0.36, 1.12, 1], [0.47, 1.12, 1],
    [0.57, 2, 1], [0.63, 2, 1], [0.69, 0.42, 0.92], [0.8, 0.5, 0.92], [0.89, 2.8, 0.92],
    [0.96, 1.42, 0.42], [1, 1.42, 0.42],
  ],
};
function camera(keys: Key[], p: number): [number, number] {
  for (let i = 1; i < keys.length; i++) {
    const [p1, x1, z1] = keys[i], [p0, x0, z0] = keys[i - 1];
    if (p <= p1) { const t = ease(seg(p, p0, p1)); return [lerp(x0, x1, t), lerp(z0, z1, t)]; }
  }
  const last = keys[keys.length - 1];
  return [last[1], last[2]];
}

/** World layout per breakpoint: zone unit as a share of width, and heights as a share of H. */
const LAYOUT = {
  desktop: { u: 0.62, anchor: 0.64, card: 0.76, ground: 0.92 },
  mobile: { u: 0.98, anchor: 0.5, card: 0.77, ground: 0.92 },
};

type Pt = [number, number];
const curve = (a: Pt, b: Pt, lift = 46) => {
  const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - lift;
  return `M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
};

export function LifecycleScene() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = root.current!;
    const visual = section.querySelector<HTMLElement>(".lc__visual")!;
    const q = <T extends Element = HTMLElement>(s: string) => section.querySelector(s) as T;
    const qa = <T extends Element = HTMLElement>(s: string) => Array.from(section.querySelectorAll(s)) as T[];

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) section.removeAttribute("data-sc-act");
    else section.setAttribute("data-live", "");
    const small = matchMedia("(max-width: 860px)");

    const el = {
      world: q(".lc__world"),
      fg: qa(".lc__fin"),
      card: { jonathan: q(`[data-person="jonathan"]`), sarah: q(`[data-person="sarah"]`), david: q(`[data-person="david"]`) },
      fin: q(".lc__group--finance"),
      mkt: q(".lc__group--marketing"),
      portal: q(".lc__app"),
      session: q(".lc__session"),
      block: q(".lc__block"),
      line: Object.fromEntries(qa<SVGPathElement>(".lc__line").map((l) => [l.dataset.line!, l])) as Record<string, SVGPathElement>,
      head: q(".lc__head"),
      end: q(".lc__end"),
      stepper: q(".lc__stepper"),
      steps: qa(".lc__step"),
    };

    let target = reduce ? 1 : 0, current = -1, raf = 0, dead = false;
    let top = 0, travel = 1, W = 1, H = 1;

    const measure = () => {
      W = visual.clientWidth; H = visual.clientHeight;
      top = section.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, section.offsetHeight - innerHeight);
      const L = small.matches ? LAYOUT.mobile : LAYOUT.desktop;
      el.world.style.setProperty("--U", `${(L.u * W).toFixed(1)}px`);
      el.world.style.setProperty("--H", `${H.toFixed(1)}px`);
    };

    // Geometry is read from the last painted frame, before any write.
    const rect = (e: Element, o: DOMRect) => { const r = e.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height }; };
    const draw = (id: string, d: string, amount: number, opacity = 1) => {
      const l = el.line[id];
      l.setAttribute("d", d);
      l.style.strokeDashoffset = (1 - amount).toFixed(4);
      l.style.opacity = (amount > 0.001 ? opacity : 0).toFixed(3);
    };

    const apply = (p: number) => {
      const mobile = small.matches;
      const L = mobile ? LAYOUT.mobile : LAYOUT.desktop;
      const U = L.u * W;
      const o = visual.getBoundingClientRect();
      const r = {
        jonathan: rect(el.card.jonathan, o), sarah: rect(el.card.sarah, o), david: rect(el.card.david, o),
        fin: rect(el.fin, o), mkt: rect(el.mkt, o), portal: rect(el.portal, o), session: rect(el.session, o),
      };

      // --- camera ------------------------------------------------------------
      const [cx, z] = camera(mobile ? CAMERA.mobile : CAMERA.desktop, p);
      // Static frame: centre the wide shot vertically instead of sitting it on the ground line.
      const tx = (reduce ? W * 0.5 : W * L.anchor) - cx * U * z, ty = H * L.ground * (1 - z) - (reduce ? 0.24 * H : 0);
      el.world.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${z.toFixed(4)})`;
      // Foreground fins: closer than the world, so they truck 1.7x and blur.
      el.fg.forEach((f, i) => {
        const k = [1.7, 2.1, 1.5][i % 3];
        f.style.transform = `translate3d(${(-cx * U * k + (i + 1) * 0.9 * W).toFixed(1)}px,0,0)`;
      });

      // --- the three identities ---------------------------------------------
      const place = (e: HTMLElement, xU: number, yH: number, s = 1, op = 1) => {
        e.style.transform = `translate3d(${(xU * U).toFixed(1)}px,${(yH * H).toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(4)})`;
        e.style.opacity = op.toFixed(3);
      };
      // Jonathan: arrives, walks into Finance, then steps back so Sarah has the stage.
      const jIn = seg(p, 0.08, 0.11), jWalk = ease(seg(p, 0.1, 0.17)), jRest = ease(seg(p, 0.33, 0.37));
      place(el.card.jonathan, lerp(lerp(0.22, 0.97, jWalk), 0.82, jRest), lerp(L.card, L.card + 0.04, jRest), lerp(1, 0.8, jRest), jIn * lerp(1, 0.62, jRest) * lerp(1, 0.55, seg(p, 0.64, 0.68)));
      // Sarah: starts in Finance with the same access, then moves to Marketing.
      const sIn = seg(p, 0.35, 0.39), sWalk = ease(seg(p, 0.47, 0.56));
      place(el.card.sarah, lerp(1.26, 2, sWalk), L.card, 1, sIn * lerp(1, 0.7, seg(p, 0.66, 0.7)));
      // David: arrives at the entrance, is offboarded there, then leaves.
      const dIn = seg(p, 0.66, 0.7), dWalk = ease(seg(p, 0.82, 0.9));
      place(el.card.david, lerp(0.3, 2.86, dWalk), L.card, 1, dIn * lerp(1, 0.55, seg(p, 0.8, 0.86)));

      // Attribute checks against the Finance rule, and the two state flips.
      const check = (who: string, attr: string, state: string | null) => {
        const li = el.card[who as keyof typeof el.card].querySelector<HTMLElement>(`[data-attr="${attr}"]`)!;
        if (state) li.dataset.check = state; else delete li.dataset.check;
      };
      check("jonathan", "dept", p > 0.17 ? "pass" : null);
      check("jonathan", "company", p > 0.185 ? "pass" : null);
      check("jonathan", "type", p > 0.2 ? "pass" : null);
      check("david", "dept", p > 0.71 ? "pass" : null);
      check("david", "company", p > 0.72 ? "fail" : null);
      el.card.sarah.style.setProperty("--flip", ease(seg(p, 0.4, 0.44)).toFixed(4));
      el.card.david.style.setProperty("--flip", ease(seg(p, 0.75, 0.78)).toFixed(4));
      el.card.david.toggleAttribute("data-disabled", p > 0.765);
      el.session.toggleAttribute("data-revoked", p > 0.795);

      // --- access lines -----------------------------------------------------
      const topOf = (b: { x: number; y: number; w: number }): Pt => [b.x + b.w / 2, b.y];
      const bottomOf = (b: { x: number; y: number; w: number; h: number }): Pt => [b.x + b.w / 2, b.y + b.h];
      const rightOf = (b: { x: number; y: number; w: number; h: number }): Pt => [b.x + b.w, b.y + b.h / 2];
      const leftOf = (b: { x: number; y: number; h: number }): Pt => [b.x, b.y + b.h / 2];

      const jDim = lerp(1, 0.45, jRest);
      const jFin = easeOut(seg(p, 0.21, 0.25));
      const jApp = easeOut(seg(p, 0.26, 0.31));
      draw("j-fin", curve(topOf(r.jonathan), bottomOf(r.fin)), jFin, jDim);
      draw("j-app", curve(topOf(r.jonathan), bottomOf(r.portal), 90), jApp, jDim);

      const sOn = easeOut(seg(p, 0.37, 0.41));
      const sFin = sOn * (1 - ease(seg(p, 0.45, 0.49)));
      const sApp = sOn * (1 - ease(seg(p, 0.44, 0.48)));
      const sMkt = easeOut(seg(p, 0.56, 0.6));
      draw("s-fin", curve(topOf(r.sarah), bottomOf(r.fin)), sFin);
      draw("s-app", curve(topOf(r.sarah), bottomOf(r.portal), 90), sApp);
      draw("s-mkt", curve(topOf(r.sarah), bottomOf(r.mkt)), sMkt);

      // The group's own assignment to the app: always configured, lit while it is carrying access.
      const carrying = Math.max(jApp * jDim, sApp);
      draw("fin-app", curve(rightOf(r.fin), leftOf(r.portal), 30), 1, lerp(0.3, 1, carrying));
      el.fin.toggleAttribute("data-lit", jFin > 0.5 || sFin > 0.5);
      el.mkt.toggleAttribute("data-lit", sMkt > 0.5);
      el.portal.toggleAttribute("data-lit", carrying > 0.5);

      // David: a probe toward the employee-only group that never connects.
      const a = topOf(r.david), b = bottomOf(r.fin);
      const reach = easeOut(seg(p, 0.71, 0.74)) * 0.58;
      const probeOut = 1 - seg(p, 0.79, 0.82);
      const end: Pt = [lerp(a[0], b[0], reach), lerp(a[1], b[1], reach)];
      const probe = el.line["d-probe"];
      probe.setAttribute("d", `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${end[0].toFixed(1)},${end[1].toFixed(1)}`);
      probe.style.opacity = (reach > 0.01 ? probeOut : 0).toFixed(3);
      const blockOn = seg(p, 0.735, 0.75) * probeOut;
      el.block.style.opacity = blockOn.toFixed(3);
      el.block.style.transform = `translate3d(${end[0].toFixed(1)}px,${end[1].toFixed(1)}px,0) translate(-50%,-50%)`;
      // The Entra session tether, cut on revocation.
      // Desktop: the session sits beside the card; phone: below it.
      const sa = mobile ? bottomOf(r.david) : rightOf(r.david), sb = mobile ? topOf(r.session) : leftOf(r.session);
      draw("d-sess", `M${sa[0].toFixed(1)},${sa[1].toFixed(1)} L${sb[0].toFixed(1)},${sb[1].toFixed(1)}`,
        dIn * (1 - ease(seg(p, 0.785, 0.81))));
      el.session.style.opacity = (dIn * lerp(1, 0.6, seg(p, 0.8, 0.84))).toFixed(3);

      if (reduce) return;

      // --- copy and stepper (pinned only) ------------------------------------
      const headOut = seg(p, 0.06, 0.09);
      el.head.style.opacity = (1 - headOut).toFixed(3);
      el.head.style.transform = `translate3d(0,${(-headOut * 20).toFixed(1)}px,0)`;
      const endIn = easeOut(seg(p, 0.92, 0.97));
      el.end.style.opacity = endIn.toFixed(3);
      el.end.style.transform = `translate3d(0,${((1 - endIn) * 18).toFixed(1)}px,0)`;
      el.end.style.pointerEvents = endIn > 0.5 ? "auto" : "none";
      el.stepper.style.setProperty("--fill", seg(p, 0.06, 0.9).toFixed(4));
      const cur = p < 0.07 ? -1 : p < 0.34 ? 0 : p < 0.635 ? 1 : 2;
      el.steps.forEach((s, i) => {
        if (i === cur) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current");
        s.toggleAttribute("data-done", i < cur || p > 0.91);
      });
    };

    const frame = () => {
      raf = 0;
      if (dead) return;
      const next = current < 0 ? target : current + (target - current) * 0.15;
      const settled = Math.abs(next - target) < 0.0003;
      current = settled ? target : next;
      apply(current);
      if (!settled) raf = requestAnimationFrame(frame);
      else requestAnimationFrame(() => { if (!dead) apply(current); });
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
    const goTo = (at: number) => { measure(); window.scrollTo({ top: top + at * travel, behavior: "instant" }); };
    // The stepper is navigation: each stage jumps to its resolved moment.
    const onStep = (e: Event) => {
      const at = parseFloat((e.currentTarget as HTMLElement).dataset.at!);
      goTo(at);
    };
    el.steps.forEach((s) => s.addEventListener("click", onStep));
    const onFocus = (e: FocusEvent) => { if (el.end.contains(e.target as Node)) goTo(0.98); };

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
      el.steps.forEach((s) => s.removeEventListener("click", onStep));
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      small.removeEventListener("change", onResize);
      section.removeEventListener("focusin", onFocus);
      section.removeAttribute("data-live");
    };
  }, []);

  return (
    <section ref={root} id="lifecycle" className="lc" data-sc-act="pan" data-sc-span="7" data-ground="dark"
      aria-labelledby="lifecycle-title">
      <div className="lc__stage" data-sc-stage>
        {/* ------------------------------------------------ the visual */}
        <div className="lc__visual" aria-hidden="true">
          {/* L0 · far skyline: panned by the engine itself (data-sc-pan) */}
          <div className="lc__sky" />
          <div className="lc__skyline" data-sc-pan="0">
            {Array.from({ length: 22 }, (_, i) => (
              <span key={i} className="lc__tower" style={{ "--h": `${28 + ((i * 37) % 46)}%`, "--w": `${3 + ((i * 13) % 4)}vw` } as React.CSSProperties} />
            ))}
          </div>
          <div className="lc__dust" data-sc-parallax="-0.7" />

          {/* L1 + L2 · the organization: entrance, departments, groups, app, exit */}
          <div className="lc__world">
            <div className="lc__ground" />
            <div className="lc__gate lc__gate--in" style={{ "--x": 0.22 } as React.CSSProperties}><span>CFG · Microsoft Entra ID</span></div>
            <div className="lc__zone lc__zone--finance" style={{ "--x": 1 } as React.CSSProperties}>
              <span className="lc__zone-word">Finance</span>
            </div>
            <div className="lc__zone lc__zone--marketing" style={{ "--x": 2 } as React.CSSProperties}>
              <span className="lc__zone-word">Marketing</span>
            </div>
            <div className="lc__gate lc__gate--out" style={{ "--x": 2.86 } as React.CSSProperties}><span>Leaves CFG</span></div>

            <div className="lc__group lc__group--finance" style={{ "--x": 0.78, "--y": 0.56 } as React.CSSProperties}>
              <span className="lc__ring" /><span><strong>CFG Finance Employees</strong><em>Dynamic group · employee-only</em></span>
            </div>
            <div className="lc__app" style={{ "--x": 1.24, "--y": 0.42 } as React.CSSProperties}>
              <span className="lc__app-mark" /><span><strong>CFG Finance Portal</strong><em>Enterprise app · group assignment</em></span>
            </div>
            <div className="lc__group lc__group--marketing" style={{ "--x": 2, "--y": 0.56 } as React.CSSProperties}>
              <span className="lc__ring" /><span><strong>Marketing</strong><em>Dynamic group</em></span>
            </div>

            {people.map((m) => (
              <div key={m.id} className="lc__card" data-person={m.id}>
                <div className="lc__card-head">
                  <span className="lc__avatar">{m.initials}</span>
                  <span className="lc__who"><strong>{m.name}</strong><span>{m.role}</span></span>
                  <span className="lc__status">
                    {m.id === "david" ? (
                      <span className="lc__flip"><span>Enabled</span><span>Disabled</span></span>
                    ) : "Enabled"}
                  </span>
                </div>
                <ul className="lc__attrs">
                  <li data-attr="dept"><span>Department</span>
                    <b>{m.dept[1] ? <span className="lc__flip"><span>{m.dept[0]}</span><span>{m.dept[1]}</span></span> : m.dept[0]}</b>
                  </li>
                  <li data-attr="company"><span>Company</span><b>{m.company}</b></li>
                  <li data-attr="type"><span>Type</span><b>{m.type}</b></li>
                </ul>
                {m.id === "david" && (
                  <div className="lc__session"><span className="lc__session-on">Entra sessions</span><span className="lc__session-off">Sessions revoked</span></div>
                )}
              </div>
            ))}
          </div>

          {/* L3 · access lines, drawn in screen space from the live geometry */}
          <svg className="lc__lines">
            <path className="lc__line lc__line--assign" data-line="fin-app" pathLength={1} />
            <path className="lc__line lc__line--member" data-line="j-fin" pathLength={1} />
            <path className="lc__line lc__line--inherit" data-line="j-app" pathLength={1} />
            <path className="lc__line lc__line--member" data-line="s-fin" pathLength={1} />
            <path className="lc__line lc__line--inherit" data-line="s-app" pathLength={1} />
            <path className="lc__line lc__line--member lc__line--mkt" data-line="s-mkt" pathLength={1} />
            <path className="lc__line lc__line--probe" data-line="d-probe" />
            <path className="lc__line lc__line--session" data-line="d-sess" pathLength={1} />
          </svg>
          <span className="lc__block">Not eligible</span>

          {/* A scrim only where the captions sit */}
          <div className="lc__scrim" />

          {/* L4 · foreground glass fins: closest plane, out of focus */}
          <span className="lc__fin lc__fin--1" />
          <span className="lc__fin lc__fin--2" />
          <span className="lc__fin lc__fin--3" />
        </div>

        {/* ------------------------------------------------ the copy */}
        <div className="lc__copy">
          <p className="lc__kicker mono">Lifecycle · CFG Phase 2</p>
          <header className="lc__head">
            <h2 id="lifecycle-title" className="lc__title">Lifecycle.</h2>
            <p className="lc__lede">Access that follows the person. Three CFG test identities, one lifecycle.</p>
          </header>
          <ol className="lc__stages">
            {stages.map((s) => (
              <li key={s.id} className="lc__stage-copy" data-sc-cue={s.cue}>
                <h3 className="lc__stage-title">{s.title}</h3>
                <p className="lc__stage-body">{s.body}</p>
                <p className="lc__stage-note mono">{s.note}</p>
              </li>
            ))}
          </ol>
          <div className="lc__end">
            <p className="lc__recap" aria-hidden="true">Access follows <span>the person.</span></p>
            <div className="lc__links">
              <a className="btn btn--solid" href={PHASE2_PAGE}>Full Phase 2 case study</a>
              <a className="lc__gh" href={PHASE2_REPO} target="_blank" rel="noopener noreferrer">
                Evidence on GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Joiner · Mover · Leaver: progress, and a way to jump between stages */}
        <nav className="lc__stepper" aria-label="Lifecycle stages">
          <span className="lc__stepper-track" aria-hidden="true"><span /></span>
          {stages.map((s) => (
            <button key={s.id} type="button" className="lc__step" data-at={s.at}>{s.label}</button>
          ))}
        </nav>
      </div>
    </section>
  );
}
