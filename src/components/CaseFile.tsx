import type { CaseFile as Case } from "@/content/cases";
import { ChainDiagram } from "./ChainDiagram";
import { ExhibitGallery } from "./ExhibitGallery";

const Arrow = () => <span aria-hidden="true">→</span>;

/**
 * One case study, in the seven parts a technical reviewer asks for:
 * problem, environment, architecture, implementation, principles,
 * results and lessons, evidence.
 */
export function CaseFile({ c, pull }: { c: Case; pull?: React.ReactNode }) {
  const scopeAt = c.implementation.findIndex((s) => s.anchor === "scope");
  const before = scopeAt > 0 ? c.implementation.slice(0, scopeAt) : c.implementation;
  const after = scopeAt > 0 ? c.implementation.slice(scopeAt) : [];

  return (
    <article className="case" id={c.id} aria-labelledby={`${c.id}-title`}>
      <header className="case__head" data-sc-in>
        <div className="case__no" aria-hidden="true">{c.number}</div>
        <div>
          <p className="mono" style={{ color: "var(--sc-ink-soft)", margin: "0 0 0.75rem" }}>Case file {c.number}</p>
          <h1 id={`${c.id}-title`} className="display case__title">{c.title}</h1>
          <p className="case__meta">{c.org} · {c.year} · hands-on lab</p>
        </div>
      </header>

      <div className="case__body">
        <aside className="case__aside">
          <section>
            <h2 className="mono">The problem</h2>
            <p className="lede">{c.problem}</p>
          </section>
          <section>
            <h2 className="mono">Environment</h2>
            <ul className="env">{c.environment.map((e) => <li key={e}>{e}</li>)}</ul>
          </section>
          <section>
            <h2 className="mono">Documentation</h2>
            <ul className="doclinks">
              <li><a href={c.repo} target="_blank" rel="noopener noreferrer"><span>GitHub repository</span><Arrow /></a></li>
              {c.docs.map((d) => (
                <li key={d.href}><a href={d.href} target="_blank" rel="noopener noreferrer"><span>{d.label}</span><Arrow /></a></li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="case__main">
          <section>
            <h2 className="mono">Architecture · {c.architecture.title}</h2>
            <ChainDiagram title={c.architecture.title} nodes={c.architecture.nodes} />
          </section>

          <section>
            <h2 className="mono">Implementation</h2>
            <ol className="steps">
              {before.map((s) => <li key={s.title}><div><h3>{s.title}</h3><p>{s.body}</p></div></li>)}
            </ol>
            {pull}
            {after.length > 0 && (
              <ol className="steps" start={before.length + 1} style={{ counterReset: `s ${before.length}` }}>
                {after.map((s) => <li key={s.title}><div><h3>{s.title}</h3><p>{s.body}</p></div></li>)}
              </ol>
            )}
          </section>

          <section>
            <h2 className="mono">Security principles applied</h2>
            <table className="principles">
              <caption className="sr-only">Security principles and how they were applied</caption>
              <tbody>
                {c.principles.map((p) => <tr key={p.name}><th scope="row">{p.name}</th><td>{p.applied}</td></tr>)}
              </tbody>
            </table>
          </section>

          <section className="split2">
            <div>
              <h2 className="mono">Results</h2>
              <ul>{c.results.map((r) => <li key={r}>{r}</li>)}</ul>
              <h2 className="mono" style={{ marginTop: "var(--sc-6)" }}>Lessons learned</h2>
              <ul>{c.lessons.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
            <div className="limits">
              <h2 className="mono">What this does not prove</h2>
              <ul>{c.limitations.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
          </section>

          <section>
            <h2 className="mono">Evidence</h2>
            {c.exhibits.length > 0 ? (
              <ExhibitGallery exhibits={c.exhibits} caseNo={c.number} />
            ) : (
              <p style={{ margin: 0, maxWidth: "56ch" }}>
                Screenshots of the tenant configuration, certification dashboard, remediation queue and audit export
                are published in the{" "}
                <a className="link" href={c.repo} target="_blank" rel="noopener noreferrer">repository gallery</a>,
                with a PDF implementation guide for each of the five phases.
              </p>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}
