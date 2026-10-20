// The Privilege chapter: CFG Phase 1 as a scene. Every named element and every
// claim comes from the Phase 1 README (github.com/Camj78/cashville-financial-
// group-iam/tree/main/phase-1-identity-design). The unlabeled figures on the
// tenant floor are illustrative, not a user count.

export const PHASE1_REPO = "https://github.com/Camj78/cashville-financial-group-iam/tree/main/phase-1-identity-design";
export const PHASE1_PAGE = "/cfg/phase-1";

/** AU-New York on the tenant floor, in % of the floor. */
export const AU = { x: 57, y: 18, w: 31, h: 54 };

export type Beat = { title: string; body: string; cue: string };

/** One beat per control. `cue` is a Scroll Craft cue window on the act's progress. */
export const beats: Beat[] = [
  {
    title: "Role is what.",
    body: "User Administrator sets what Marcus Reed (Admin) can do. Unscoped, it reaches the whole tenant.",
    cue: "0.17 0.39 0.22",
  },
  {
    title: "Scope is where.",
    body: "AU-New York limits that role to New York identities, like Jennifer Parker.",
    cue: "0.4 0.59 0.22",
  },
  {
    title: "Eligible, not standing.",
    body: "The scoped role is assigned through PIM as eligible, so it is not held permanently.",
    cue: "0.6 0.74 0.24",
  },
  {
    title: "Break glass, kept apart.",
    body: "EA-01 and EA-02 hold Global Administrator for recovery only, outside everyday administration.",
    cue: "0.75 0.87 0.24",
  },
];

// Deterministic layout so server and client render identical markup.
const rand = (() => { let s = 20261020; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const inside = (u: number, v: number, pad = 0) =>
  u > AU.x + pad && u < AU.x + AU.w - pad && v > AU.y + pad && v < AU.y + AU.h - pad;

export type Token = { u: number; v: number; au: boolean; id?: string };

export const tokens: Token[] = (() => {
  const out: Token[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const u = 6 + col * 12.4 + (rand() - 0.5) * 5;
      const v = 9 + row * 19.5 + (rand() - 0.5) * 7;
      const near = inside(u, v, -3) && !inside(u, v, 4);
      if (near) continue; // keep figures clear of the boundary walls
      out.push({ u: +u.toFixed(2), v: +v.toFixed(2), au: inside(u, v) });
    }
  }
  // The representative New York identity: the AU figure nearest its centre.
  const cx = AU.x + AU.w / 2, cy = AU.y + AU.h / 2;
  let best = -1, d = Infinity;
  out.forEach((t, i) => { if (!t.au) return; const k = (t.u - cx) ** 2 + (t.v - cy) ** 2; if (k < d) { d = k; best = i; } });
  if (best > -1) out[best].id = "jennifer";
  return out;
})();
