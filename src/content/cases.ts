// Case studies. Every statement is sourced from Cameron's public repositories:
//   CFG   https://github.com/Camj78/cashville-financial-group-iam
//   GHOSTD https://github.com/Camj78/ghostd-identity-governance-implementation
// Limitations are copied in deliberately: they are part of the evidence.
//
// The published site shows CFG only. GHOSTD (case-03) is kept here locally until
// the redesign is approved, and is filtered out by `publishedCases`.

export type Exhibit = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

export type ChainNode = { label: string; note: string };

export type CaseFile = {
  id: string;
  number: string;
  title: string;
  org: string;
  year: string;
  repo: string;
  docs: { label: string; href: string }[];
  environment: string[];
  problem: string;
  architecture: { title: string; nodes: ChainNode[] };
  implementation: { title: string; body: string; anchor?: string }[];
  principles: { name: string; applied: string }[];
  results: string[];
  limitations: string[];
  lessons: string[];
  exhibits: Exhibit[];
};

const CFG = "https://github.com/Camj78/cashville-financial-group-iam";
const GHOSTD = "https://github.com/Camj78/ghostd-identity-governance-implementation";
const ev = (name: string) => `/evidence/optimized/${name}.webp`;

export const cases: CaseFile[] = [
  {
    id: "case-01",
    number: "01",
    title: "Privileged access you can explain",
    org: "Cashville Financial Group (simulated)",
    year: "2026",
    repo: `${CFG}/tree/main/phase-1-identity-design`,
    docs: [
      { label: "Phase 1 README", href: `${CFG}/blob/main/phase-1-identity-design/README.md` },
      { label: "Evidence folder", href: `${CFG}/tree/main/phase-1-identity-design/evidence` },
      { label: "Troubleshooting", href: `${CFG}/tree/main/phase-1-identity-design/troubleshooting` },
    ],
    environment: [
      "Microsoft Entra ID",
      "Privileged Identity Management",
      "Administrative Units",
      "Entra built-in roles",
      "Microsoft Graph",
      "Audit logs",
    ],
    problem:
      "A financial services firm needs administrators to do privileged work without doing it from everyday accounts, without tenant-wide authority they do not need, and without standing privilege, while keeping a recovery path if normal admin access fails.",
    architecture: {
      title: "Who, what, how, where",
      nodes: [
        { label: "Privileged identity", note: "Marcus Reed (Admin), separate from his workforce account" },
        { label: "User Administrator", note: "Built-in role instead of broader authority" },
        { label: "PIM eligible", note: "Just-in-time, no standing assignment" },
        { label: "AU-New York", note: "Administrative Unit boundary" },
        { label: "New York identities", note: "e.g. Jennifer Parker" },
      ],
    },
    implementation: [
      {
        title: "Separated workforce and privileged identities",
        body: "Marcus Reed has a normal workforce account for daily work and a dedicated admin identity for IAM tasks, so routine activity never runs with privileged credentials.",
      },
      {
        title: "Two emergency-access accounts",
        body: "EA-01 and EA-02 hold Global Administrator for recovery only, with authentication and sign-in baselines reviewed.",
      },
      {
        title: "Delegated administration with an Administrative Unit",
        body: "AU-New York sets a boundary around New York identities. The role says what an admin can do; the unit says where.",
        anchor: "scope",
      },
      {
        title: "Least privilege on two axes",
        body: "User Administrator scoped to AU-New York limits both the level and the reach of Marcus's authority.",
      },
      {
        title: "PIM eligibility instead of standing access",
        body: "The scoped role is assigned as PIM eligible, so privilege is activated when needed rather than held permanently.",
      },
      {
        title: "Troubleshot a failed PIM assignment, then cleaned up",
        body: "Audit logs surfaced a RoleNotFound condition. Microsoft Graph was used to inspect the role definition and eligibility schedules. Temporary privilege and Graph PIM write permission were removed after remediation.",
      },
    ],
    principles: [
      { name: "Identity separation", applied: "Workforce and admin identities for the same person" },
      { name: "Least privilege", applied: "User Administrator, not a broader role" },
      { name: "Administrative scoping", applied: "Role limited to AU-New York" },
      { name: "Reduced standing privilege", applied: "PIM eligible assignment" },
      { name: "Emergency access", applied: "Two break-glass Global Administrators" },
      { name: "Privilege cleanup", applied: "Troubleshooting access revoked afterwards" },
    ],
    results: [
      "A privileged-access model that answers who, what role, how it is granted, and where it applies.",
      "A documented failure, investigation and remediation path: failure, evidence, investigation, remediation, validation, cleanup.",
      "The environment returned to least privilege after troubleshooting.",
    ],
    limitations: [
      "Cloud-only educational lab, not a production deployment.",
      "Cashville Financial Group and its people are fictional lab scenarios.",
    ],
    lessons: [
      "Role and scope solve different problems.",
      "Administrative Units set administrative scope; they do not grant application access.",
      "Temporary privilege used for troubleshooting must not silently become permanent.",
    ],
    exhibits: [
      {
        src: ev("CFG-Phase1-Identity-Architecture"), width: 1536, height: 1024,
        alt: "Phase 1 identity architecture diagram for Cashville Financial Group showing workforce, privileged and emergency-access identities.",
        caption: "Phase 1 identity architecture",
      },
      {
        src: ev("CFG-Phase1-Marcus-UserAdmin-AU-New-York-Least-Privilege-Final"), width: 1600, height: 743,
        alt: "Entra admin center showing Marcus Reed's admin identity with User Administrator scoped to AU-New York.",
        caption: "User Administrator scoped to AU-New York",
      },
      {
        src: ev("CFG-Phase1-Marcus-PIM-Eligible-UserAdmin-AU-New-York"), width: 1600, height: 607,
        alt: "PIM eligible assignment of User Administrator for Marcus Reed's admin identity on AU-New York.",
        caption: "PIM eligible assignment",
      },
      {
        src: ev("CFG-Phase1-AU-New-York-Created"), width: 1600, height: 743,
        alt: "Administrative Unit AU-New York created in Microsoft Entra ID.",
        caption: "AU-New York boundary",
      },
      {
        src: ev("CFG-Phase1-PIM-RoleNotFound-Audit-Evidence"), width: 1600, height: 830,
        alt: "Audit log detail showing a RoleNotFound condition during the PIM assignment attempt.",
        caption: "RoleNotFound in the audit log",
      },
    ],
  },
  {
    id: "case-02",
    number: "02",
    title: "Access that follows the person",
    org: "Cashville Financial Group (simulated)",
    year: "2026",
    repo: `${CFG}/tree/main/phase-2-identity-lifecycle`,
    docs: [
      { label: "Case study", href: `${CFG}/blob/main/phase-2-identity-lifecycle/PORTFOLIO_CASE_STUDY.md` },
      { label: "Phase 2 README", href: `${CFG}/blob/main/phase-2-identity-lifecycle/README.md` },
      { label: "Evidence index (26 captures)", href: `${CFG}/blob/main/phase-2-identity-lifecycle/EVIDENCE_INDEX.md` },
    ],
    environment: [
      "Microsoft Entra ID",
      "Dynamic security groups",
      "Enterprise applications",
      "Identity attributes",
      "Audit logs",
    ],
    problem:
      "Access needs to follow a worker's job: a new hire gets what the role requires, a transfer loses what the old role granted, and a departure is contained quickly, without stale permissions left behind.",
    architecture: {
      title: "Attribute to access",
      nodes: [
        { label: "Identity record", note: "Department, company, employee type" },
        { label: "Dynamic group", note: "CFG Finance Employees, rule-evaluated" },
        { label: "App assignment", note: "CFG Finance Portal, group-inherited" },
      ],
    },
    implementation: [
      {
        title: "Joiner: Jonathan Jones",
        body: "Created a Finance employee (Department Finance, Company CFG, Employee). Entra placed him in CFG Finance Employees and he inherited the CFG Finance Portal assignment.",
      },
      {
        title: "Mover: Sarah Mitchell",
        body: "Changed Finance to Marketing. Dynamic membership moved her to Marketing and the group-derived Finance Portal assignment disappeared.",
      },
      {
        title: "Leaver: David Coleman",
        body: "A contractor, excluded from the employee-only Finance group. Disabled the account, revoked Entra sign-in sessions, and verified AccountEnabled true to false and the StsRefreshTokensValidFrom update in the audit log.",
      },
    ],
    principles: [
      { name: "Attribute-based access", applied: "Membership computed from identity data" },
      { name: "Least privilege", applied: "Contractor excluded from employee-only access" },
      { name: "Privilege-creep prevention", applied: "Mover loses inherited Finance access" },
      { name: "Containment", applied: "Disable plus session revocation" },
      { name: "Auditability", applied: "Modified properties reviewed in audit logs" },
    ],
    results: [
      "Joiner inherited the right application through group membership, with no per-user assignment.",
      "Mover's stale Finance assignment was removed by rule evaluation.",
      "Leaver's account was disabled and sessions revoked, both visible in audit records.",
    ],
    limitations: [
      "No HR-driven provisioning, SCIM, or downstream app-account deletion is claimed.",
      "Session revocation does not end every independent application session.",
      "David had no prior entitlements, so entitlement removal was not demonstrated for him.",
    ],
    lessons: [
      "A dynamic rule is only as good as the attribute it reads.",
      "Group-derived assignment, app provisioning and active sessions are separate concerns.",
      "Department-wide groups should not carry individual exceptions.",
    ],
    exhibits: [
      {
        src: ev("CFG-Phase2-Finance-Dynamic-Group-Rule"), width: 1600, height: 759,
        alt: "Dynamic membership rule for the CFG Finance Employees group in Microsoft Entra ID.",
        caption: "Finance dynamic group rule",
      },
      {
        src: ev("CFG-Phase2-Joiner-Jonathan-Inherited-App-Assignment"), width: 1600, height: 743,
        alt: "Jonathan Jones's applications view showing CFG Finance Portal inherited from group membership.",
        caption: "Joiner: inherited app assignment",
      },
      {
        src: ev("CFG-Phase2-Sarah-Finance-Portal-Assignment-Removed"), width: 1600, height: 743,
        alt: "Sarah Mitchell's applications view after the move, with the Finance Portal assignment gone.",
        caption: "Mover: Finance Portal removed",
      },
      {
        src: ev("CFG-Phase2-David-Leaver-Account-Disabled-Audit"), width: 1600, height: 628,
        alt: "Audit log modified properties showing AccountEnabled changed from true to false for David Coleman.",
        caption: "Leaver: account disabled (audit)",
      },
      {
        src: ev("CFG-Phase2-David-Leaver-Sessions-Revoked-Audit"), width: 1600, height: 628,
        alt: "Audit log modified properties showing StsRefreshTokensValidFrom updated for David Coleman.",
        caption: "Leaver: sessions revoked (audit)",
      },
    ],
  },
  {
    id: "case-03",
    number: "03",
    title: "Governance someone can audit",
    org: "GHOSTD Corporation (fictional)",
    year: "2026",
    repo: GHOSTD,
    docs: [
      { label: "Repository README", href: `${GHOSTD}#readme` },
      { label: "Implementation guides (PDF)", href: `${GHOSTD}/tree/main/docs/Implementation-Guides` },
    ],
    environment: [
      "Microsoft Entra ID",
      "Security groups (RBAC)",
      "Enterprise applications",
      "Excel access-review dataset",
      "React and TypeScript",
      "GitHub",
    ],
    problem:
      "Manual provisioning, inconsistent assignments, privilege that accumulates after transfers, slow offboarding and undocumented access reviews leave an organization without audit evidence.",
    architecture: {
      title: "Lifecycle to certification",
      nodes: [
        { label: "Workforce identities", note: "25 users in Entra ID" },
        { label: "Security groups", note: "Role-based access control" },
        { label: "Joiner, mover, leaver", note: "Provision, modify, revoke" },
        { label: "Access certification", note: "Approve, Revoke, Needs Review" },
        { label: "Remediation and audit export", note: "Evidence for reviewers" },
      ],
    },
    implementation: [
      {
        title: "Identity foundation and RBAC",
        body: "Configured an Entra ID environment for 25 users with security groups, application access and least-privilege controls.",
      },
      {
        title: "Joiner, mover, leaver processes",
        body: "Provisioned, modified and revoked access as identity and employment changed, including remediation of privilege creep.",
      },
      {
        title: "Access certification workflow",
        body: "Built an access review and certification app (React, TypeScript) supporting Approve, Revoke and Needs Review decisions with reviewer comments, a remediation queue and an audit evidence export.",
      },
    ],
    principles: [
      { name: "Role-based access control", applied: "Access granted through security groups" },
      { name: "Least privilege", applied: "Privilege creep remediated on transfer" },
      { name: "Recertification", applied: "Reviewer decisions recorded per entitlement" },
      { name: "Audit readiness", applied: "Decisions and remediation exported as evidence" },
    ],
    results: [
      "Five documented phases: identity foundation, joiner, mover, leaver, access certification.",
      "A working certification and remediation workflow with exportable audit evidence.",
      "Implementation guides for each phase published as PDFs.",
    ],
    limitations: [
      "GHOSTD is a fictional organization built for this lab.",
      "Dynamic groups, lifecycle workflows, PIM, access packages and Conditional Access are listed as planned in the repository, not implemented.",
    ],
    lessons: [
      "Certification is only useful if remediation is tracked to completion.",
      "Reviewers need context per entitlement, not a bare list of names.",
    ],
    exhibits: [],
  },
];

/** The only case files the site renders: Cashville Financial Group. */
export const publishedCases = cases.filter((c) => c.org.startsWith("Cashville Financial Group"));
