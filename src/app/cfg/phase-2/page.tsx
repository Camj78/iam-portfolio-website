import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/CaseStudyShell";
import { publishedCases } from "@/content/cases";

/*
  The complete CFG Phase 2 case file, moved off the homepage so the Lifecycle
  chapter can tell it visually: architecture, implementation, principles,
  results, limitations, lessons and the redacted evidence.
*/

const case02 = publishedCases.find((c) => c.id === "case-02")!;

export const metadata: Metadata = {
  title: "CFG Phase 2: Identity lifecycle | Cameron Johnson",
  description:
    "Cashville Financial Group IAM lab, Phase 2: joiner, mover and leaver tests with dynamic security groups, group-based enterprise app assignment, account disablement, session revocation and audit evidence.",
};

export default function Phase2() {
  return <CaseStudyShell c={case02} back="/#lifecycle" />;
}
