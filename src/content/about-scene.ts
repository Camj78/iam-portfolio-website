// The About chapter: the person behind the access. Every fact comes from the
// IAM résumé (Aug 2026, via profile.ts) or the CFG lab repository. The Nissan
// roles were systems analysis and service planning, never IAM engineering, and
// SC-300 is in progress, never earned. GHOSTD and "access reviews" (a GHOSTD
// result) stay off this chapter.

import { profile } from "@/content/profile";

export const ariaLine = "Out of the vault. Let me introduce the person behind the access.";

export const scenes = [
  {
    id: "foundation",
    label: "01 · Foundation",
    title: "Built on experience.",
    body: "Three-plus years at Nissan North America supporting business-critical applications: incident investigation, root-cause analysis, and the requirements work between application owners and technical teams.",
  },
  {
    id: "transition",
    label: "02 · Transition",
    title: "Driven by identity.",
    // Cameron's own wording (approved 2026-10-20).
    body: "My experience solving business and technology problems sparked a deeper interest in cybersecurity. Identity and access management is where I'm building my next chapter.",
  },
  {
    id: "practice",
    label: "03 · Practice",
    title: "Proven through practice.",
    body: "Two CFG phases built and evidenced in Microsoft Entra ID: privileged access, then joiner-mover-leaver. Now preparing for SC-300.",
  },
] as const;

export const closing = "I document every control like an auditor will read it.";

/** The second object: what drew him to identity. Interests, not claimed experience. */
export const interests = ["Access governance", "Least privilege", "Identity lifecycle", "Security engineering"];

/** The third object: hands-on practice. Only completed CFG phases are "evidenced". */
export const practice = [
  { id: "p1", label: "CFG Phase 1", title: "Privileged access", status: "Evidenced", href: "/cfg/phase-1" },
  { id: "p2", label: "CFG Phase 2", title: "Joiner · mover · leaver", status: "Evidenced", href: "/cfg/phase-2" },
] as const;

export const sc300 = {
  title: "Microsoft SC-300",
  name: "Identity and Access Administrator",
  status: "In progress · expected 2026",
  href: "#certifications",
};

/** "Read my story": the long form, behind a dialog. */
export const story = {
  title: "From enterprise systems to identity and access.",
  transition: [
    "My experience solving business and technology problems sparked a deeper interest in cybersecurity. Identity and access management is where I'm building my next chapter.",
    "My roles at Nissan have been systems analysis and service planning, not IAM engineering. My identity work so far is hands-on lab work in Microsoft Entra ID, documented in public so anyone can check it.",
  ],
  experience: profile.experience,
  lab: {
    intro:
      "Cashville Financial Group (CFG) is a simulated organization I built in Microsoft Entra ID to practice identity and access management end to end.",
    phases: [
      {
        name: "Phase 1 · Privileged access",
        href: "/cfg/phase-1",
        summary:
          "Separate workforce and admin identities, two emergency-access accounts, an Administrative Unit boundary, and a User Administrator role scoped to it and assigned through PIM as eligible, not standing.",
      },
      {
        name: "Phase 2 · Joiner, mover, leaver",
        href: "/cfg/phase-2",
        summary:
          "An attribute-based dynamic group, app access inherited through group membership, stale access removed on a department move, and a leaver disabled with sessions revoked, both verified in the audit log.",
      },
    ],
  },
  certification:
    "Microsoft SC-300: Identity and Access Administrator. In progress, expected 2026. Not yet earned; the CFG labs are where I practice its domains.",
  education: profile.education,
};
