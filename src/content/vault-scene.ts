// The Validation chapter: the evidence vault. Every "demonstrated" panel is a
// capability with completed CFG lab evidence. Screenshots are the redacted
// copies in /public/evidence/optimized only (admin account, tenant domain and
// browser bar hidden). Panels without a redacted copy link to GitHub instead.
// "Learning" is SC-300 study with no CFG evidence; "Next" is a planned lab.

const CFG = "https://github.com/Camj78/cashville-financial-group-iam/tree/main";
const P1 = `${CFG}/phase-1-identity-design`;
const P2 = `${CFG}/phase-2-identity-lifecycle`;
const BLOB2 = "https://github.com/Camj78/cashville-financial-group-iam/blob/main/phase-2-identity-lifecycle";
const shot = (name: string, w: number, h: number, alt: string) => ({ src: `/evidence/optimized/${name}.webp`, w, h, alt });

export type Shot = ReturnType<typeof shot>;

export type Evidence = {
  id: string;
  title: string;
  claim: string;
  phase: 1 | 2;
  shots: Shot[];
  github: { label: string; href: string };
};

export type Category = { id: string; label: string; items: Evidence[] };

export const vault: Category[] = [
  {
    id: "identity",
    label: "Identity administration",
    items: [
      {
        id: "separation", phase: 1,
        title: "Workforce and admin identities separated",
        claim: "Marcus Reed has an everyday workforce account and a separate admin identity for IAM tasks.",
        shots: [shot("CFG-Phase1-Identity-Architecture", 1536, 1024, "CFG Phase 1 identity architecture: workforce, privileged and emergency-access identities.")],
        github: { label: "Identity separation evidence", href: `${P1}/evidence/01-identity-separation` },
      },
      {
        id: "emergency", phase: 1,
        title: "Two emergency-access accounts",
        claim: "EA-01 and EA-02 hold Global Administrator for recovery only, with authentication and sign-in baselines reviewed.",
        shots: [],
        github: { label: "Emergency-access evidence", href: `${P1}/evidence/02-emergency-access` },
      },
    ],
  },
  {
    id: "scope",
    label: "Scoped administration",
    items: [
      {
        id: "au", phase: 1,
        title: "Administrative Unit boundary",
        claim: "AU-New York sets the administrative boundary around New York identities.",
        shots: [shot("CFG-Phase1-AU-New-York-Created", 1600, 743, "Administrative Unit AU-New York in Microsoft Entra ID.")],
        github: { label: "Administrative Unit evidence", href: `${P1}/evidence/03-administrative-units` },
      },
      {
        id: "scoped-role", phase: 1,
        title: "User Administrator scoped to AU-New York",
        claim: "Least privilege on two axes: a narrower built-in role, limited to one administrative unit.",
        shots: [shot("CFG-Phase1-Marcus-UserAdmin-AU-New-York-Least-Privilege-Final", 1600, 743, "Marcus Reed (Admin) with User Administrator scoped to AU-New York.")],
        github: { label: "Least-privilege evidence", href: `${P1}/evidence/04-least-privilege` },
      },
    ],
  },
  {
    id: "privileged",
    label: "Privileged access",
    items: [
      {
        id: "pim", phase: 1,
        title: "PIM eligible assignment",
        claim: "The scoped role is assigned through Privileged Identity Management as eligible, not standing.",
        shots: [shot("CFG-Phase1-Marcus-PIM-Eligible-UserAdmin-AU-New-York", 1600, 607, "PIM eligible assignment of User Administrator on AU-New York.")],
        github: { label: "PIM evidence", href: `${P1}/evidence/05-pim` },
      },
      {
        id: "troubleshoot", phase: 1,
        title: "Audit log and Microsoft Graph investigation",
        claim: "A failed PIM assignment was traced to a RoleNotFound condition in the audit log, then investigated with Graph.",
        shots: [shot("CFG-Phase1-PIM-RoleNotFound-Audit-Evidence", 1600, 744, "Audit log entries showing the RoleNotFound condition during the PIM assignment attempt.")],
        github: { label: "Troubleshooting evidence", href: `${P1}/troubleshooting` },
      },
    ],
  },
  {
    id: "jml",
    label: "Joiner · Mover · Leaver",
    items: [
      {
        id: "dynamic", phase: 2,
        title: "Attribute-based dynamic group",
        claim: "CFG Finance Employees is computed from department and employee type.",
        shots: [shot("CFG-Phase2-Finance-Dynamic-Group-Rule", 1600, 759, "Dynamic membership rule for CFG Finance Employees.")],
        github: { label: "Phase 2 evidence index", href: `${BLOB2}/EVIDENCE_INDEX.md` },
      },
      {
        id: "joiner", phase: 2,
        title: "Group-inherited app access for a joiner",
        claim: "Jonathan Jones inherited the CFG Finance Portal through Finance group membership, with no per-user assignment.",
        shots: [shot("CFG-Phase2-Joiner-Jonathan-Inherited-App-Assignment", 1600, 743, "Jonathan Jones's CFG Finance Portal assignment inherited from group membership.")],
        github: { label: "Phase 2 README", href: `${BLOB2}/README.md` },
      },
      {
        id: "leaver", phase: 2,
        title: "Leaver contained: disabled and sessions revoked",
        claim: "David Coleman's account was disabled and Entra sessions revoked, both verified in the audit log.",
        shots: [
          shot("CFG-Phase2-David-Leaver-Account-Disabled-Audit", 1600, 628, "Audit detail: AccountEnabled changed from true to false for David Coleman."),
          shot("CFG-Phase2-David-Leaver-Sessions-Revoked-Audit", 1600, 628, "Audit detail: StsRefreshTokensValidFrom updated for David Coleman."),
        ],
        github: { label: "Phase 2 evidence index", href: `${BLOB2}/EVIDENCE_INDEX.md` },
      },
    ],
  },
  {
    id: "remediation",
    label: "Access remediation",
    items: [
      {
        id: "mover", phase: 2,
        title: "Stale access removed on a move",
        claim: "After Sarah Mitchell moved to Marketing, the group-derived Finance Portal assignment disappeared.",
        shots: [shot("CFG-Phase2-Sarah-Finance-Portal-Assignment-Removed", 1600, 743, "Sarah Mitchell's applications view with the Finance Portal assignment removed.")],
        github: { label: "Phase 2 README", href: `${BLOB2}/README.md` },
      },
      {
        id: "cleanup", phase: 1,
        title: "Temporary privilege removed after use",
        claim: "Troubleshooting privilege and Microsoft Graph PIM write permission were revoked once the fix was in place.",
        shots: [],
        github: { label: "Cleanup evidence", href: `${P1}/troubleshooting` },
      },
    ],
  },
];

export const demonstratedCount = vault.reduce((n, c) => n + c.items.length, 0);

/** SC-300 study: no CFG evidence yet, so no panel is ever lit. */
export const learning = [
  "Conditional Access policy design",
  "Authentication methods and MFA",
  "Workload identities and app registrations",
  "Access reviews and certification",
];

/** Planned hands-on labs. */
export const next = [
  "Entitlement management and access packages",
  "Lifecycle workflows",
  "HR-driven provisioning and SCIM",
];

export const casePage = (phase: 1 | 2) => (phase === 1 ? "/cfg/phase-1" : "/cfg/phase-2");
export const P1_REPO = P1;
export const P2_REPO = P2;
