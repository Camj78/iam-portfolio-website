import { CinematicHero } from "@/components/CinematicHero";
import { IdentityContinuation } from "@/components/IdentityContinuation";
import { PrivilegeScene } from "@/components/PrivilegeScene";
import { LifecycleScene } from "@/components/LifecycleScene";
import { VaultScene } from "@/components/VaultScene";
import { AboutScene } from "@/components/AboutScene";
import { AccessPathRail } from "@/components/AccessPathRail";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollCraftMount } from "@/components/ScrollCraftMount";
import { LoungeScene } from "@/components/LoungeScene";
import { CertificationsSection, RequestAccessSection, SiteFooter } from "@/components/SharedSections";
import { LITE_GUARD } from "@/lib/view";

// The cinematic home page. Phones and tablets get /m instead (src/proxy.ts); LITE_GUARD catches a
// touch-first device that reached this page anyway (iPadOS asks for desktop sites) before hydration.
export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LITE_GUARD }} />
      <noscript>
        <style>{`[data-sc-in],[data-sc-stagger]>*,[data-sc-cue]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <a className="skip" href="#identity">Skip to content</a>

      <SiteHeader />

      <AccessPathRail />

      <main>
        {/* REDESIGN · vertical slice: the studio and the push into Identity */}
        <CinematicHero />
        <IdentityContinuation />

        {/* PRIVILEGE · CFG Phase 1 (redesign). The full case file lives at /cfg/phase-1. */}
        <PrivilegeScene />

        {/* LIFECYCLE · CFG Phase 2 (redesign). The full case file lives at /cfg/phase-2. */}
        <LifecycleScene />

        {/* VALIDATION · the evidence vault (redesign) */}
        <VaultScene />

        {/* ABOUT · the person behind the access (redesign) */}
        <AboutScene />

        {/* CERTIFICATIONS (approved order: after About). */}
        <CertificationsSection reveal />

        {/* THE ACCESS LOUNGE · entering the studio (redesign) */}
        <LoungeScene />

        {/* REQUEST ACCESS */}
        <RequestAccessSection reveal />
      </main>

      <SiteFooter />

      <ScrollCraftMount />
    </>
  );
}
