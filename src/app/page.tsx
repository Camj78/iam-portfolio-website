import { CinematicHero } from "@/components/CinematicHero";
import { IdentityContinuation } from "@/components/IdentityContinuation";
import { PrivilegeScene } from "@/components/PrivilegeScene";
import { LifecycleScene } from "@/components/LifecycleScene";
import { VaultScene } from "@/components/VaultScene";
import { AboutScene } from "@/components/AboutScene";
import { AccessPathRail } from "@/components/AccessPathRail";
import { SiteHeader } from "@/components/SiteHeader";
import { RequestRecord } from "@/components/RequestRecord";
import { ScrollCraftMount } from "@/components/ScrollCraftMount";
import { FloatCard } from "@/components/FloatCard";
import { LoungeScene } from "@/components/LoungeScene";
import { profile } from "@/content/profile";


const SC300_DOMAINS = [
  "Implement and manage user identities",
  "Implement authentication and access management",
  "Plan and implement workload identities",
  "Plan and automate identity governance",
];

export default function Home() {
  return (
    <>
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

        {/* ---- Below this line: Milestone 1 sections, unchanged pending approval ---- */}

        {/* CERTIFICATIONS (approved order: after About). Milestone 1 content, pending its stage. */}
        <section id="certifications" className="chapter chapter--dark" data-ground="dark" aria-labelledby="certifications-title">
          <div className="wrap">
            <div className="cert" data-sc-in>
              <div>
                <h2 id="certifications-title" className="display" style={{ fontSize: "var(--sc-t-2xl)" }}>Certifications and learning</h2>
                <p style={{ color: "var(--sc-ink-soft)", marginTop: "var(--sc-4)", maxWidth: "44ch" }}>
                  No certification is shown here as earned until it is. SC-300 is the current focus, and the
                  case files above are where I practice its domains.
                </p>
              </div>
              <FloatCard className="cert__card">
                <span className="cert__badge mono">In progress · expected 2026</span>
                <h3>Microsoft SC-300: Identity and Access Administrator</h3>
                <p>Microsoft certification exam. Study areas:</p>
                <ul className="domains" style={{ marginTop: "var(--sc-4)" }}>
                  {SC300_DOMAINS.map((d) => <li key={d}><span>{d}</span><span className="mono" style={{ color: "var(--sc-ink-soft)" }}>Studying</span></li>)}
                </ul>
              </FloatCard>
            </div>
          </div>
        </section>

        {/* THE ACCESS LOUNGE · entering the studio (redesign) */}
        <LoungeScene />

        {/* REQUEST ACCESS */}
        <section id="contact" className="chapter chapter--forest chapter--contact" data-ground="dark" aria-labelledby="contact-title">
          <div className="wrap">
            <div className="request" data-sc-in>
              <div className="request__copy">
                <p className="mono request__kicker">Final chapter · Connect</p>
                <h2 id="contact-title" className="display">Request access.</h2>
                <p className="request__statement">You&rsquo;ve seen the controls. Now let&rsquo;s build something secure.</p>
                <p className="lede">
                  I&rsquo;m moving into Identity and Access Management, focused on IAM Analyst, IAM Engineer and
                  identity governance roles. Whether you&rsquo;re hiring, recruiting, working in IAM or have a project
                  in mind, email is the fastest route. My resumé has the full history.
                </p>
              </div>
              <RequestRecord />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <span>© 2026 Cameron Johnson</span>
          <nav aria-label="Footer">
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={profile.portfolioRepo} target="_blank" rel="noopener noreferrer">Site source</a>
            <a href={profile.resume} download>Resumé (PDF)</a>
            <a href="#top">Back to top</a>
          </nav>
        </div>
      </footer>

      <ScrollCraftMount />
    </>
  );
}
