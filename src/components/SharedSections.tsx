import { FloatCard } from "@/components/FloatCard";
import { RequestRecord } from "@/components/RequestRecord";
import { profile } from "@/content/profile";

/*
  The chapters both home pages render the same way: Certifications, Request access and the
  footer. `reveal` adds the Scroll Craft entrance (desktop); the lightweight page has no engine,
  so its copies stay plain and always visible.
*/

const SC300_DOMAINS = [
  "Implement and manage user identities",
  "Implement authentication and access management",
  "Plan and implement workload identities",
  "Plan and automate identity governance",
];

const sc = (reveal: boolean) => (reveal ? { "data-sc-in": true } : {});

export function CertificationsSection({ reveal = false }: { reveal?: boolean }) {
  return (
    <section id="certifications" className="chapter chapter--dark" data-ground="dark" aria-labelledby="certifications-title">
      <div className="wrap">
        <div className="cert" {...sc(reveal)}>
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
  );
}

export function RequestAccessSection({ reveal = false }: { reveal?: boolean }) {
  return (
    <section id="contact" className="chapter chapter--forest chapter--contact" data-ground="dark" aria-labelledby="contact-title">
      <div className="wrap">
        <div className="request" {...sc(reveal)}>
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
  );
}

export function SiteFooter() {
  return (
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
  );
}
