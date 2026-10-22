// The identity system the hero camera pushes into. Every label is taken from the
// Cashville Financial Group lab (github.com/Camj78/cashville-financial-group-iam):
// Phase 1 for the focused cluster, Phase 2 for the distant constellation.
// Positions are percentages of the stage. `start` is where an object floats in
// the studio before the wall opens; `end` is its place in the Identity scene.

export type Pt = { x: number; y: number };

export type SceneNode = {
  id: string;
  title: string;
  meta: string;
  kind: "person" | "workforce" | "privileged" | "role" | "breakglass";
  initials?: string;
  /** Depth while floating in the studio: 0 far, 1 near. Sets parallax rate, scale and blur. */
  depth: number;
  /** Final opacity. Foreshadowed nodes rest dimmer than the focus cluster. */
  rest?: number;
  start: Pt;
  end: Pt;
  mStart: Pt;
  mEnd: Pt;
};

export const sceneNodes: SceneNode[] = [
  {
    id: "person", title: "Marcus Reed", meta: "One person", kind: "person", initials: "MR", depth: 0.42,
    start: { x: 82, y: 26 }, end: { x: 49, y: 57 },
    mStart: { x: 84, y: 14 }, mEnd: { x: 27, y: 53 },
  },
  {
    id: "workforce", title: "Workforce account", meta: "Daily work", kind: "workforce", depth: 0.3,
    start: { x: 90, y: 13 }, end: { x: 70, y: 41 },
    mStart: { x: 12, y: 47 }, mEnd: { x: 71, y: 45 },
  },
  {
    id: "admin", title: "Marcus Reed (Admin)", meta: "Privileged · IAM tasks", kind: "privileged", depth: 0.36,
    start: { x: 93, y: 56 }, end: { x: 70, y: 73 },
    mStart: { x: 90, y: 50 }, mEnd: { x: 71, y: 61 },
  },
  {
    id: "role", title: "User Administrator", meta: "Built-in role", kind: "role", depth: 0.22, rest: 0.6,
    start: { x: 47, y: 7 }, end: { x: 89, y: 85 },
    mStart: { x: 50, y: 9 }, mEnd: { x: 71, y: 77 },
  },
  {
    id: "ea1", title: "EA-01", meta: "Emergency access", kind: "breakglass", depth: 0.26,
    start: { x: 31, y: 52 }, end: { x: 82, y: 18 },
    mStart: { x: 10, y: 30 }, mEnd: { x: 27, y: 85 },
  },
  {
    id: "ea2", title: "EA-02", meta: "Emergency access", kind: "breakglass", depth: 0.2,
    start: { x: 96, y: 76 }, end: { x: 88, y: 30 },
    mStart: { x: 92, y: 80 }, mEnd: { x: 71, y: 91 },
  },
];

/** Edges drawn once the cluster lands. Dashed edges point at later chapters. */
export const sceneLinks: { from: string; to: string; dashed?: boolean }[] = [
  { from: "person", to: "workforce" },
  { from: "person", to: "admin" },
  { from: "admin", to: "role", dashed: true },
];

/** The rest of the lab, far behind the focus cluster: later chapters, out of focus. */
export const farNodes: { title: string; meta: string; at: Pt; m?: Pt }[] = [
  { title: "AU-New York", meta: "Administrative Unit", at: { x: 61, y: 13 } },
  { title: "PIM", meta: "Eligible assignment", at: { x: 93, y: 58 } },
  { title: "Jennifer Parker", meta: "New York identity", at: { x: 36, y: 79 } },
  { title: "CFG Finance Employees", meta: "Dynamic group", at: { x: 15, y: 93 }, m: { x: 30, y: 71 } },
  { title: "CFG Finance Portal", meta: "Enterprise app", at: { x: 60, y: 95 } },
  { title: "Jonathan Jones", meta: "Joiner", at: { x: 32, y: 66 } },
  { title: "Sarah Mitchell", meta: "Mover", at: { x: 78, y: 58 } },
  { title: "David Coleman", meta: "Leaver", at: { x: 72, y: 96 }, m: { x: 90, y: 70 } },
];

export const CFG_REPO = "https://github.com/Camj78/cashville-financial-group-iam";
export const CFG_PHASE1 = `${CFG_REPO}/tree/main/phase-1-identity-design`;
