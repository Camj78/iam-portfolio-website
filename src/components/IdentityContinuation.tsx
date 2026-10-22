import { CFG_PHASE1 } from "@/content/identity-scene";

/*
  Where the pinned scene lets go. Same ground as the resolved Identity frame,
  so the release reads as the camera continuing down, not as a cut. The
  evidence plane and its backing plate sit on different Scroll Craft
  parallax rates.
*/

const TYPES = [
  { n: "01", title: "Workforce", body: "Marcus Reed's everyday account, used for daily work." },
  { n: "02", title: "Privileged", body: "A separate admin identity, Marcus Reed (Admin), used only for IAM tasks." },
  { n: "03", title: "Emergency access", body: "EA-01 and EA-02 hold Global Administrator for recovery only." },
];

export function IdentityContinuation() {
  return (
    <section className="idx" data-sc-act="flow" data-ground="dark" aria-label="Identity types in the CFG lab">
      <div className="wrap">
        <div className="idx__grid">
          <ol className="idx__types" data-sc-in data-sc-stagger="90">
            {TYPES.map((t) => (
              <li key={t.n}>
                <span className="mono">{t.n}</span>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </li>
            ))}
          </ol>
          <figure className="idx__frame" style={{ margin: 0 }}>
            <div className="idx__plate" data-sc-parallax="0.6" aria-hidden="true" />
            <div data-sc-parallax="-0.5">
              <a className="idx__shot" href={`${CFG_PHASE1}/architecture`} target="_blank" rel="noopener noreferrer">
                <img src="/evidence/optimized/CFG-Phase1-Identity-Architecture.webp" width={1536} height={1024}
                  loading="lazy" decoding="async"
                  alt="CFG Phase 1 identity architecture diagram: workforce, privileged and emergency-access identities in Microsoft Entra ID." />
              </a>
            </div>
            <figcaption className="idx__caption mono">
              <span>Phase 1 identity architecture · redacted</span>
              <a href={CFG_PHASE1} target="_blank" rel="noopener noreferrer">Phase 1 on GitHub ↗</a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
