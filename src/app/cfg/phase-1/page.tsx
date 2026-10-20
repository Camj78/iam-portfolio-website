import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/CaseStudyShell";
import { publishedCases } from "@/content/cases";

/*
  The complete CFG Phase 1 case file, moved off the homepage so the Privilege
  chapter can tell it visually. Same content and evidence as Milestone 1; the
  dedicated-page redesign is a later stage.
*/

const case01 = publishedCases.find((c) => c.id === "case-01")!;

export const metadata: Metadata = {
  title: "CFG Phase 1: Privileged access | Cameron Johnson",
  description:
    "Cashville Financial Group IAM lab, Phase 1: separate admin identity, User Administrator scoped to AU-New York, PIM eligibility, emergency access and documented troubleshooting.",
};

export default function Phase1() {
  return (
    <CaseStudyShell
      c={case01}
      back="/#privilege"
      pull={
        <div className="pull" id="scope" data-sc-in>
          <p className="display">Role is <span>what.</span></p>
          <p className="display">Scope is <span>where.</span></p>
          <p>
            A Microsoft Entra role decides what an administrator can do. An Administrative Unit decides where
            they can do it. Least privilege needs both, so Marcus&apos;s User Administrator role only reaches AU-New York.
          </p>
        </div>
      }
    />
  );
}
