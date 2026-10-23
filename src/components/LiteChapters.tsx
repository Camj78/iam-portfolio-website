import { profile } from "@/content/profile";
import { CFG_PHASE1 } from "@/content/identity-scene";
import { IDENTITY_TYPES } from "@/components/IdentityContinuation";
import { beats, PHASE1_PAGE, PHASE1_REPO } from "@/content/privilege-scene";
import { stages, people, PHASE2_PAGE, PHASE2_REPO } from "@/content/lifecycle-scene";
import { vault, demonstratedCount, learning, next, casePage } from "@/content/vault-scene";
import { ariaLine, scenes, closing, interests, practice, sc300, story } from "@/content/about-scene";
import { lounge, episodes } from "@/content/lounge";

/*
  The lightweight home page's chapters (/m, phones and tablets; see lib/view.ts). Same order,
  copy, evidence and links as the cinematic chapters, drawn in 2D: no 3D transforms, no canvas,
  no scene effects, no animation loops. Every claim and link comes from the same content modules
  the cinematic scenes use. `data-lr` marks blocks that LiteReveal fades in; without JavaScript
  they are simply visible.
*/

const GH = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className="lt-gh" href={href} target="_blank" rel="noopener noreferrer">{children} <span aria-hidden="true">↗</span></a>
);

export function LiteHero() {
  return (
    <section id="top" className="lt-hero" data-ground="dark" aria-labelledby="hero-title">
      <div className="lt-hero__glow" aria-hidden="true" />
      <div className="wrap lt-hero__inner">
        <p className="mono lt-kicker">Identity &amp; Access Management</p>
        <h1 id="hero-title" className="display lt-hero__title">Identity Secured. <span>Access Governed.</span></h1>
        <p className="lt-hero__lede">Hands-on Microsoft Entra ID: identity governance, RBAC, least privilege and joiner-mover-leaver lifecycle.</p>
        <figure className="lt-hero__set">
          <div className="lt-hero__aria">
            <img src="/aria/optimized/aria-front-480.webp" srcSet="/aria/optimized/aria-front-480.webp 480w, /aria/optimized/aria-front-760.webp 760w"
              sizes="(max-width: 600px) 78vw, 420px" width={760} height={941} fetchPriority="high"
              alt="A.R.I.A., a felt puppet host in a tan suit, white shirt and green striped tie, seated at a studio desk." />
          </div>
          <div className="lt-hero__desk" aria-hidden="true" />
          <figcaption className="mono">A.R.I.A. · your host · Cashville Financial Group IAM lab</figcaption>
        </figure>
        <p className="lt-hero__claim">Least privilege, on the record.</p>
        <p className="mono lt-hero__sub">Privileged access · Scoped administration · Joiner, mover, leaver</p>
        <div className="lt-actions">
          <a className="btn btn--solid" href="#identity">Enter the CFG lab</a>
          <a className="btn btn--ghost" href={profile.resume} download>Resumé (PDF)</a>
        </div>
      </div>
    </section>
  );
}

export function LiteIdentity() {
  return (
    <section id="identity" className="lt-chapter" data-ground="dark" aria-labelledby="identity-title">
      <div className="wrap">
        <header className="lt-head" data-lr>
          <p className="mono lt-kicker">Identity · CFG Phase 1 · Microsoft Entra ID</p>
          <h2 id="identity-title" className="display lt-title">Identity.</h2>
          <p className="lt-lede">One person, two identities. Daily work never runs on privileged credentials.</p>
        </header>
        <ol className="lt-steps" data-lr>
          {IDENTITY_TYPES.map((t) => (
            <li key={t.n}><span className="mono">{t.n}</span><h3>{t.title}</h3><p>{t.body}</p></li>
          ))}
        </ol>
        <figure className="lt-shot" data-lr>
          <a href={`${CFG_PHASE1}/architecture`} target="_blank" rel="noopener noreferrer">
            <img src="/evidence/optimized/CFG-Phase1-Identity-Architecture.webp" width={1536} height={1024} loading="lazy" decoding="async"
              alt="CFG Phase 1 identity architecture diagram: workforce, privileged and emergency-access identities in Microsoft Entra ID." />
          </a>
          <figcaption className="mono"><span>Phase 1 identity architecture · redacted</span><GH href={CFG_PHASE1}>Phase 1 on GitHub</GH></figcaption>
        </figure>
      </div>
    </section>
  );
}

export function LitePrivilege() {
  return (
    <section id="privilege" className="lt-chapter lt-chapter--alt" data-ground="dark" aria-labelledby="privilege-title">
      <div className="wrap">
        <header className="lt-head" data-lr>
          <p className="mono lt-kicker">Privilege · CFG Phase 1</p>
          <h2 id="privilege-title" className="display lt-title">Privilege.</h2>
          <p className="lt-lede">Control the boundary. Privileged work runs on a separate admin identity, not the everyday account.</p>
        </header>
        <div className="lt-board" data-lr aria-label="The Phase 1 assignment">
          <p className="lt-board__row"><span className="lt-tag">Who</span><b>Marcus Reed (Admin)</b><em>Privileged identity</em></p>
          <p className="lt-board__row"><span className="lt-tag">What</span><b>User Administrator</b><em>Built-in role</em></p>
          <p className="lt-board__row" id="scope"><span className="lt-tag">Where</span><b>AU-New York</b><em>Administrative Unit</em></p>
          <p className="lt-board__row"><span className="lt-tag">How</span><b>PIM</b><em>Eligible, not standing</em></p>
          <p className="lt-board__vault"><span className="mono">Emergency access</span><b>EA-01 · EA-02</b><em>Global Administrator · recovery only</em></p>
        </div>
        <ol className="lt-beats" data-lr>
          {beats.map((b) => <li key={b.title}><h3>{b.title}</h3><p>{b.body}</p></li>)}
        </ol>
        <div className="lt-actions" data-lr>
          <a className="btn btn--solid" href={PHASE1_PAGE}>Full Phase 1 case study</a>
          <GH href={PHASE1_REPO}>Evidence on GitHub</GH>
        </div>
      </div>
    </section>
  );
}

export function LiteLifecycle() {
  const who = Object.fromEntries(people.map((p, i) => [stages[i].id, p]));
  return (
    <section id="lifecycle" className="lt-chapter" data-ground="dark" aria-labelledby="lifecycle-title">
      <div className="wrap">
        <header className="lt-head" data-lr>
          <p className="mono lt-kicker">Lifecycle · CFG Phase 2</p>
          <h2 id="lifecycle-title" className="display lt-title">Lifecycle.</h2>
          <p className="lt-lede">Access that follows the person. Three CFG test identities, one lifecycle.</p>
        </header>
        <ol className="lt-stages">
          {stages.map((s) => {
            const p = who[s.id];
            return (
              <li key={s.id} className="lt-stage" data-stage={s.id} data-lr>
                <div className="lt-person">
                  <span className="lt-avatar" aria-hidden="true">{p.initials}</span>
                  <span><strong>{p.name}</strong><span>{p.role}</span></span>
                </div>
                <dl className="lt-attrs">
                  <div><dt>Department</dt><dd>{p.dept[1] ? `${p.dept[0]} → ${p.dept[1]}` : p.dept[0]}</dd></div>
                  <div><dt>Company</dt><dd>{p.company}</dd></div>
                  <div><dt>Type</dt><dd>{p.type}</dd></div>
                </dl>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <p className="mono lt-note">{s.note}</p>
              </li>
            );
          })}
        </ol>
        <div className="lt-actions" data-lr>
          <a className="btn btn--solid" href={PHASE2_PAGE}>Full Phase 2 case study</a>
          <GH href={PHASE2_REPO}>Evidence on GitHub</GH>
        </div>
      </div>
    </section>
  );
}

export function LiteValidation() {
  return (
    <section id="validation" className="lt-chapter lt-chapter--alt" data-ground="dark" aria-labelledby="validation-title">
      <div className="wrap">
        <header className="lt-head" data-lr>
          <p className="mono lt-kicker">Validation · CFG evidence</p>
          <h2 id="validation-title" className="display lt-title">Validation.</h2>
          <p className="lt-lede">The evidence vault. Only completed CFG lab work is stored here. {demonstratedCount} capabilities, each one on file.</p>
        </header>
        {vault.map((c) => (
          <div key={c.id} className="lt-group" data-lr>
            <h3 className="mono lt-group__label">{c.label}</h3>
            <ul className="lt-evidence">
              {c.items.map((e) => (
                <li key={e.id}>
                  {e.shots[0] ? (
                    <a className="lt-evidence__shot" href={e.shots[0].src} target="_blank" rel="noopener noreferrer">
                      <img src={e.shots[0].src} alt={e.shots[0].alt} width={e.shots[0].w} height={e.shots[0].h} loading="lazy" decoding="async" />
                    </a>
                  ) : (
                    <span className="lt-evidence__shot lt-evidence__shot--none mono">Documented on GitHub</span>
                  )}
                  <p className="mono lt-evidence__meta">CFG Phase {e.phase}</p>
                  <h4>{e.title}</h4>
                  <p>{e.claim}</p>
                  <p className="lt-evidence__links">
                    <a href={casePage(e.phase)}>Phase {e.phase} case study</a>
                    <GH href={e.github.href}>{e.github.label}</GH>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <ul className="lt-tiers" data-lr>
          <li data-tier="demonstrated"><b>Demonstrated</b><span>{demonstratedCount}</span><em>Completed CFG lab evidence</em></li>
          <li data-tier="learning"><b>Learning</b><span>{learning.length}</span><em>SC-300 study, not yet built</em><small>{learning.join(" · ")}</small></li>
          <li data-tier="next"><b>Next</b><span>{next.length}</span><em>Planned hands-on labs</em><small>{next.join(" · ")}</small></li>
        </ul>
        <p className="mono lt-rule" data-lr>Nothing moves up a tier without evidence.</p>
      </div>
    </section>
  );
}

export function LiteAbout() {
  return (
    <section id="about" className="lt-chapter" data-ground="dark" aria-labelledby="about-title">
      <div className="wrap">
        <header className="lt-head" data-lr>
          <h2 id="about-title" className="mono lt-kicker">About · The person behind the access</h2>
          <p className="lt-voice"><span className="mono">A.R.I.A.</span> {ariaLine}</p>
        </header>
        <ol className="lt-beats lt-beats--about" data-lr>
          {scenes.map((s) => <li key={s.id}><p className="mono">{s.label}</p><h3>{s.title}</h3><p>{s.body}</p></li>)}
        </ol>
        <div className="lt-about" data-lr>
          <div className="lt-card">
            <p className="mono lt-card__label">Nissan North America</p>
            <p className="lt-num"><b>3+</b> years supporting business-critical applications</p>
            <ul className="lt-roles">
              {profile.experience.slice().reverse().map((x) => <li key={x.title}><span>{x.title}</span><em className="mono">{x.years.replace(" to ", "–")}</em></li>)}
            </ul>
          </div>
          <div className="lt-card">
            <p className="mono lt-card__label">Drawn to</p>
            <ul className="lt-chips">{interests.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="lt-card">
            <p className="mono lt-card__label">Hands-on practice</p>
            <ul className="lt-practice">
              {practice.map((x) => <li key={x.id}><a href={x.href}><span className="mono">{x.label}</span><b>{x.title}</b><em>{x.status}</em></a></li>)}
              <li><a href={sc300.href}><span className="mono">{sc300.title}</span><b>{sc300.name}</b><em>{sc300.status}</em></a></li>
            </ul>
          </div>
        </div>
        <p className="lt-statement" data-lr>{closing}</p>
        <details className="lt-story" data-lr>
          <summary className="btn btn--solid">Read my story</summary>
          <div className="lt-story__body">
            <h3>{story.title}</h3>
            {story.transition.map((t) => <p key={t}>{t}</p>)}
            <h4 className="mono">Experience</h4>
            <ol className="lt-jobs">
              {story.experience.map((x) => (
                <li key={x.title}>
                  <p className="mono">{x.years}</p><p><b>{x.title}</b> · {x.org}</p>
                  <ul>{x.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                </li>
              ))}
            </ol>
            <h4 className="mono">The CFG lab</h4>
            <p>{story.lab.intro}</p>
            <ul className="lt-jobs">
              {story.lab.phases.map((ph) => <li key={ph.name}><a href={ph.href}>{ph.name} <span aria-hidden="true">→</span></a><p>{ph.summary}</p></li>)}
            </ul>
            <h4 className="mono">Certification</h4>
            <p>{story.certification}</p>
            <h4 className="mono">Education</h4>
            <p>{story.education.degree}<br />{story.education.school}, {story.education.year}</p>
            <div className="lt-actions">
              <a className="btn btn--solid" href={profile.resume} download>Resumé (PDF)</a>
              <a className="btn btn--ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a className="btn btn--ghost" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </details>
        <div className="lt-actions" data-lr>
          <a className="btn btn--ghost" href={profile.resume} download>Resumé (PDF)</a>
          <a className="lt-next" href="#certifications">Next · Certifications <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}

export function LiteLounge() {
  return (
    <section id="lounge" className="lt-chapter lt-lounge chapter--lounge" data-ground="lounge" aria-labelledby="lounge-title">
      <div className="wrap">
        <header className="lt-head" data-lr>
          <p className="mono lt-kicker">The podcast</p>
          <h2 id="lounge-title" className="display lt-title">The Access <span>Lounge</span></h2>
          <p className="mono lt-lounge__tagline">{lounge.tagline}</p>
        </header>
        <figure className="lt-lounge__cover" data-lr>
          <img src={lounge.cover.srcSmall} srcSet={`${lounge.cover.srcSmall} 640w, ${lounge.cover.src} 1200w`} sizes="(max-width: 600px) 88vw, 520px"
            width={lounge.cover.width} height={lounge.cover.height} alt={lounge.cover.alt} loading="lazy" decoding="async" />
          <figcaption className="mono"><i aria-hidden="true" />{lounge.disclosure}</figcaption>
        </figure>
        <p className="lt-lede" data-lr>{lounge.lede}</p>
        <ul className="mono lt-chips" aria-label="What the show covers" data-lr>{lounge.pillars.map((x) => <li key={x}>{x}</li>)}</ul>
        <div className="lt-card lt-lounge__rundown" data-lr>
          <p className="lt-lounge__status"><span className="mono lt-badge">In production</span>{lounge.status}</p>
          <h3 className="mono">Planned topics · not yet recorded</h3>
          <ol>{episodes.map((e) => <li key={e.slug}><b>{e.title}</b><span>{e.description}</span></li>)}</ol>
          <p className="lt-more">{lounge.statusMore}</p>
        </div>
        <a className="lt-next" href="#contact" data-lr>Next · Request access <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
