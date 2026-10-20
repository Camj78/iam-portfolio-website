// "Demonstrated" means there is public CFG lab evidence or résumé-listed professional experience.
// GHOSTD is excluded from the published site, so nothing here may cite it as evidence.
// "Learning" means in progress (SC-300 study) with no implementation evidence yet.
// "Next" means a stated future objective. Nothing moves up a tier without evidence.

export type SkillStatus = "demonstrated" | "learning" | "next";

export type Skill = {
  name: string;
  area: "Identity" | "Privileged access" | "Lifecycle" | "Governance" | "Authentication" | "Automation" | "Tools";
  status: SkillStatus;
  evidence?: { label: string; href: string };
};

const c1 = { label: "Case 01", href: "#case-01" };
const c2 = { label: "Case 02", href: "#case-02" };
const cv = { label: "Résumé", href: "/resume/Cameron-Johnson-IAM-Resume.pdf" };

export const skills: Skill[] = [
  { name: "Microsoft Entra ID administration", area: "Identity", status: "demonstrated", evidence: c1 },
  { name: "Workforce and privileged identity separation", area: "Identity", status: "demonstrated", evidence: c1 },
  { name: "User and group administration", area: "Identity", status: "demonstrated", evidence: c2 },
  { name: "Administrative Units and scoped roles", area: "Privileged access", status: "demonstrated", evidence: c1 },
  { name: "Privileged Identity Management (eligible assignments)", area: "Privileged access", status: "demonstrated", evidence: c1 },
  { name: "Emergency-access account design", area: "Privileged access", status: "demonstrated", evidence: c1 },
  { name: "Least privilege", area: "Privileged access", status: "demonstrated", evidence: c1 },
  { name: "Joiner, mover, leaver lifecycle", area: "Lifecycle", status: "demonstrated", evidence: c2 },
  { name: "Dynamic security groups", area: "Lifecycle", status: "demonstrated", evidence: c2 },
  { name: "Group-based enterprise app assignment", area: "Lifecycle", status: "demonstrated", evidence: c2 },
  { name: "Account disablement and session revocation", area: "Lifecycle", status: "demonstrated", evidence: c2 },
  { name: "Role-based access control (Entra built-in roles)", area: "Governance", status: "demonstrated", evidence: c1 },
  { name: "Audit log investigation", area: "Governance", status: "demonstrated", evidence: c1 },
  { name: "Microsoft Graph for investigation", area: "Automation", status: "demonstrated", evidence: c1 },
  { name: "Conditional Access policy design", area: "Authentication", status: "learning" },
  { name: "Authentication methods and MFA", area: "Authentication", status: "learning" },
  { name: "Workload identities and app registrations", area: "Identity", status: "learning" },
  { name: "Access reviews and certification", area: "Governance", status: "learning" },
  { name: "Entitlement management and access packages", area: "Governance", status: "next" },
  { name: "Lifecycle workflows", area: "Lifecycle", status: "next" },
  { name: "HR-driven provisioning and SCIM", area: "Lifecycle", status: "next" },
  { name: "ServiceNow", area: "Tools", status: "demonstrated", evidence: cv },
  { name: "Jira and Confluence", area: "Tools", status: "demonstrated", evidence: cv },
  { name: "GitHub documentation", area: "Tools", status: "demonstrated", evidence: { label: "GitHub", href: "https://github.com/Camj78" } },
];

export const statusCopy: Record<SkillStatus, { label: string; blurb: string }> = {
  demonstrated: { label: "Demonstrated", blurb: "Built and evidenced in the CFG lab, or listed professional experience" },
  learning: { label: "Learning", blurb: "In SC-300 study, not yet evidenced" },
  next: { label: "Next", blurb: "Planned objective" },
};

// Previously evidenced only by the GHOSTD project. Kept locally, not rendered,
// until the redesign is approved. Do not move back into `skills`.
export const archivedGhostdSkills: Skill[] = [
  { name: "Access reviews and certification", area: "Governance", status: "demonstrated" },
  { name: "Remediation tracking and audit evidence", area: "Governance", status: "demonstrated" },
  { name: "React and TypeScript (certification app)", area: "Automation", status: "demonstrated" },
];
