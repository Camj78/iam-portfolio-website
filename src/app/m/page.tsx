import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { LiteHero, LiteIdentity, LitePrivilege, LiteLifecycle, LiteValidation, LiteAbout, LiteLounge } from "@/components/LiteChapters";
import { LiteReveal } from "@/components/LiteReveal";
import { CertificationsSection, RequestAccessSection, SiteFooter } from "@/components/SharedSections";
import { pageMeta } from "@/lib/site-meta";
import "../lite.css";

// The lightweight home page for phones and tablets, served at / by src/proxy.ts (see lib/view.ts).
// Canonical is /, the same content as the cinematic page, so it is indexed as the home page.
export const metadata: Metadata = pageMeta({
  title: "Cameron Johnson | Identity & Access Management",
  description:
    "Cameron Johnson, Identity & Access Management. Evidence-based Microsoft Entra ID case studies in privileged access, scoped administration and joiner-mover-leaver lifecycle, from the Cashville Financial Group IAM lab.",
  path: "/",
});

export default function LiteHome() {
  return (
    <div className="lt">
      <a className="skip" href="#identity">Skip to content</a>
      <SiteHeader />
      <main>
        <LiteHero />
        <LiteIdentity />
        <LitePrivilege />
        <LiteLifecycle />
        <LiteValidation />
        <LiteAbout />
        <CertificationsSection />
        <LiteLounge />
        <RequestAccessSection />
      </main>
      <SiteFooter />
      <LiteReveal />
    </div>
  );
}
