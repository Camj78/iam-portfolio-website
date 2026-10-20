// The Lifecycle chapter: CFG Phase 2 as a scene. Sources:
//   phase-2-identity-lifecycle/README.md, PORTFOLIO_CASE_STUDY.md, EVIDENCE_INDEX.md
// Joiner, mover and leaver were tested on three different identities, so the
// scene follows one lifecycle through those three, and says so.
// Identity creation, attribute edits, disablement and session revocation were
// administrative; Entra ID evaluated dynamic membership and group-derived app
// assignment. Nothing here claims HR-driven provisioning or SCIM.

export const PHASE2_REPO = "https://github.com/Camj78/cashville-financial-group-iam/tree/main/phase-2-identity-lifecycle";
export const PHASE2_PAGE = "/cfg/phase-2";

export type Stage = {
  id: "joiner" | "mover" | "leaver";
  label: string;
  title: string;
  body: string;
  note: string;
  cue: string;
  /** Where the stepper jumps to on the act timeline. */
  at: number;
};

export const stages: Stage[] = [
  {
    id: "joiner",
    label: "Joiner",
    title: "Joiner: access granted.",
    body: "Jonathan Jones joins Finance. His attributes qualify him for CFG Finance Employees, and the CFG Finance Portal follows through the group.",
    note: "Created by an admin · membership evaluated by Entra ID",
    cue: "0.08 0.33 0.18",
    at: 0.3,
  },
  {
    id: "mover",
    label: "Mover",
    title: "Mover: access adjusted.",
    body: "Sarah Mitchell moves from Finance to Marketing. The rule re-evaluates, her group changes, and the inherited Finance Portal assignment disappears.",
    note: "Group-derived assignment removed · no downstream deprovisioning claimed",
    cue: "0.35 0.62 0.16",
    at: 0.6,
  },
  {
    id: "leaver",
    label: "Leaver",
    title: "Leaver: access revoked.",
    body: "David Coleman, a contractor, never qualified for the employee-only group. His account is disabled and his Entra sessions revoked, both confirmed in the audit log.",
    note: "AccountEnabled true → false · StsRefreshTokensValidFrom updated",
    cue: "0.64 0.9 0.14",
    at: 0.86,
  },
];

export type Person = {
  id: "jonathan" | "sarah" | "david";
  name: string;
  initials: string;
  role: string;
  dept: [string, string?];
  company: string;
  type: string;
};

export const people: Person[] = [
  { id: "jonathan", name: "Jonathan Jones", initials: "JJ", role: "Joiner · Finance Analyst", dept: ["Finance"], company: "CFG", type: "Employee" },
  { id: "sarah", name: "Sarah Mitchell", initials: "SM", role: "Mover", dept: ["Finance", "Marketing"], company: "CFG", type: "Employee" },
  { id: "david", name: "David Coleman", initials: "DC", role: "Leaver · external", dept: ["Finance"], company: "Apex Consulting", type: "Contractor" },
];
