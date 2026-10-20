// Single source for personal facts. Every value here is taken from the IAM
// résumé (Aug 2026) or Cameron's public GitHub/LinkedIn. Do not add claims that
// are not in those sources.

export const profile = {
  name: "Cameron Johnson",
  role: "Identity & Access Management",
  // Pending Cameron's confirmation before any public deploy.
  email: "camjohnson78@gmail.com",
  linkedin: "https://www.linkedin.com/in/cameron-johnson615/",
  github: "https://github.com/Camj78",
  portfolioRepo: "https://github.com/Camj78/iam-portfolio-website",
  resume: "/resume/Cameron-Johnson-IAM-Resume.pdf",
  summary:
    "Enterprise systems analyst moving into Identity & Access Management, with hands-on Microsoft Entra ID work in privileged access, scoped administration, joiner-mover-leaver lifecycle, RBAC and least privilege.",
  experience: [
    {
      org: "Nissan North America Inc.",
      title: "Sr. Planner, NCAR/ICAR-X Service",
      years: "2025 to present",
      points: [
        "Supports enterprise digital platforms through stakeholder engagement, training initiatives and operational process improvement.",
        "Analyzes platform usage data and user feedback to identify performance gaps, operational risks and improvement opportunities.",
      ],
    },
    {
      org: "Nissan North America Inc.",
      title: "Systems Analyst II",
      years: "2022 to 2025",
      points: [
        "Supported business-critical enterprise applications through incident investigation, troubleshooting and root-cause analysis.",
        "Translated business requirements into system requirements, workflows, use cases and technical documentation.",
        "Worked with application owners and technical teams to identify system risks, coordinate remediation and support governance.",
      ],
    },
  ],
  education: { school: "Middle Tennessee State University", degree: "B.B.A., Marketing", year: "2016" },
} as const;

export const accessPath = [
  { id: "identity", step: "Identity", label: "CFG lab" },
  { id: "privilege", step: "Privilege", label: "Case 01" },
  { id: "scope", step: "Scope", label: "Case 01" },
  { id: "lifecycle", step: "Lifecycle", label: "Case 02" },
  { id: "validation", step: "Validation", label: "Skills, learning" },
] as const;
