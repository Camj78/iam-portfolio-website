import { CinematicHero } from "@/components/CinematicHero";
import { IdentityContinuation } from "@/components/IdentityContinuation";
import { PrivilegeScene } from "@/components/PrivilegeScene";
import { LifecycleScene } from "@/components/LifecycleScene";
import { AccessPathRail } from "@/components/AccessPathRail";
import { SiteHeader } from "@/components/SiteHeader";
import { SkillsLedger } from "@/components/SkillsLedger";
import { RequestRecord } from "@/components/RequestRecord";
import { ScrollCraftMount } from "@/components/ScrollCraftMount";
import { profile } from "@/content/profile";
import { lounge, episodes } from "@/content/lounge";


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

        {/* ---- Below this line: Milestone 1 sections, unchanged pending approval ---- */}

        {/* VALIDATION */}
        <section id="validation" className="chapter chapter--dark" data-ground="dark" aria-labelledby="validation-title">
          <div className="wrap">
            <div className="intertitle">
              <h2 id="validation-title" className="display">Validation.</h2>
              <p>What I have proven, what I am learning, and what comes next.</p>
            </div>
            <SkillsLedger />

            <div className="cert" data-sc-in>
              <div>
                <h3 className="display" style={{ fontSize: "var(--sc-t-2xl)" }}>Certifications and learning</h3>
                <p style={{ color: "var(--sc-ink-soft)", marginTop: "var(--sc-4)", maxWidth: "44ch" }}>
                  No certification is shown here as earned until it is. SC-300 is the current focus, and the
                  case files above are where I practice its domains.
                </p>
              </div>
              <div className="cert__card">
                <span className="cert__badge mono">In progress · expected 2026</span>
                <h3>Microsoft SC-300: Identity and Access Administrator</h3>
                <p>Microsoft certification exam. Study areas:</p>
                <ul className="domains" style={{ marginTop: "var(--sc-4)" }}>
                  {SC300_DOMAINS.map((d) => <li key={d}><span>{d}</span><span className="mono" style={{ color: "var(--sc-ink-soft)" }}>Studying</span></li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT (approved order: after Validation) */}
        <section id="about" className="chapter chapter--paper" data-ground="paper" aria-labelledby="about-title">
          <div className="wrap">
            <div className="intertitle">
              <h2 id="about-title" className="display">About.</h2>
              <p>Who I am, and why identity is the work I chose.</p>
            </div>
            <div className="about">
              <div data-sc-in>
                <p className="about__statement">
                  I spent years keeping business-critical systems running. Now I build the controls that decide
                  <em> who gets into them</em>, and I document every one like an auditor will read it.
                </p>
                <div className="prose">
                  <p>
                    I&apos;m an enterprise systems analyst at <strong>Nissan North America</strong> moving into
                    Identity &amp; Access Management. For more than three years I have supported business-critical
                    applications through incident investigation, root-cause analysis, requirements and governance
                    work with application owners.
                  </p>
                  <p>
                    In my own Microsoft Entra ID labs I design and test <strong>identity governance</strong>:
                    joiner-mover-leaver lifecycle, RBAC, privileged access and least privilege.
                    Each project records what I configured, how I validated it, and what it does not prove.
                    I&apos;m currently preparing for <strong>Microsoft SC-300</strong>.
                  </p>
                </div>
                <div className="about__links">
                  <a className="btn btn--solid" href={profile.linkedin} target="_blank" rel="noopener noreferrer">Connect on LinkedIn</a>
                  <a className="btn btn--ghost" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
              </div>
              <div data-sc-in>
                <h3 className="mono" style={{ color: "var(--sc-ink-soft)", margin: "0 0 var(--sc-3)" }}>Experience</h3>
                <ol className="timeline">
                  {profile.experience.map((x) => (
                    <li key={x.title}>
                      <span className="mono when">{x.years}</span>
                      <h4>{x.title}</h4>
                      <div className="org">{x.org}</div>
                      <ul>{x.points.map((p) => <li key={p}>{p}</li>)}</ul>
                    </li>
                  ))}
                  <li>
                    <span className="mono when">{profile.education.year}</span>
                    <h4>{profile.education.degree}</h4>
                    <div className="org">{profile.education.school}</div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* THE ACCESS LOUNGE */}
        <section id="lounge" className="chapter chapter--lounge" data-ground="lounge" aria-labelledby="lounge-title">
          <div className="wrap">
            <div className="lounge">
              <div className="lounge__cover" data-sc-in>
                <img src={lounge.cover.src} srcSet={`${lounge.cover.srcSmall} 640w, ${lounge.cover.src} 1200w`}
                  sizes="(max-width: 960px) 90vw, 40vw" width={lounge.cover.width} height={lounge.cover.height}
                  alt={lounge.cover.alt} loading="lazy" decoding="async" />
              </div>
              <div data-sc-in>
                <h2 id="lounge-title" className="display"><span>The podcast</span>{lounge.title}</h2>
                <p className="mono tagline" style={{ color: "var(--sc-ink-soft)" }}>{lounge.tagline}</p>
                <p className="lede">{lounge.intro}</p>
                <div className="lounge__status">
                  <span className="cert__badge mono" style={{ borderColor: "var(--amber)", color: "var(--amber)" }}>In production</span>
                  <span style={{ color: "var(--sc-ink-soft)", fontSize: "var(--sc-t-sm)" }}>
                    No episodes published yet. Feed and platform links will appear here at launch.
                  </span>
                </div>
              </div>
            </div>
            <ul className="episodes" aria-label="Planned episodes">
              {episodes.map((e) => (
                <li key={e.slug}>
                  <span className="mono tag">Placeholder · not yet recorded</span>
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                  <span className="play" aria-hidden="true">Audio at launch</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* REQUEST ACCESS */}
        <section id="contact" className="chapter chapter--forest" data-ground="dark" aria-labelledby="contact-title">
          <div className="wrap">
            <div className="request">
              <div>
                <h2 id="contact-title" className="display">Request access.</h2>
                <p className="lede">
                  Hiring for IAM Analyst, IAM Engineer or identity governance? Email or LinkedIn is the fastest
                  route. The résumé has the full history.
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
            <a href={profile.resume} download>Résumé (PDF)</a>
            <a href="#top">Back to top</a>
          </nav>
        </div>
      </footer>

      <ScrollCraftMount />
    </>
  );
}
