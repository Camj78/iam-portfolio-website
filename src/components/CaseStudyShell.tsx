import { CaseFile } from "@/components/CaseFile";
import { ScrollCraftMount } from "@/components/ScrollCraftMount";
import type { CaseFile as Case } from "@/content/cases";
import { profile } from "@/content/profile";

/**
 * A dedicated CFG case-study page: the full case file the homepage chapter
 * summarises visually. `back` is the homepage chapter to return to.
 */
export function CaseStudyShell({ c, back, pull }: { c: Case; back: string; pull?: React.ReactNode }) {
  return (
    <>
      <noscript>
        <style>{`[data-sc-in],[data-sc-stagger]>*{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <header className="site-header" data-ground="dark" data-scrolled="">
        <a className="wordmark" href="/">Cameron Johnson</a>
        <nav aria-label="Primary">
          <a href={back}>← Back to the portfolio</a>
        </nav>
      </header>
      <main className="cs">
        <section className="chapter chapter--forest" data-ground="dark" aria-labelledby={`${c.id}-title`}>
          <div className="wrap cs__wrap">
            <CaseFile c={c} pull={pull} />
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="wrap cs__wrap">
          <span>© 2026 Cameron Johnson</span>
          <nav aria-label="Footer">
            <a href="/">Portfolio</a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={profile.resume} download>Resumé (PDF)</a>
          </nav>
        </div>
      </footer>
      <ScrollCraftMount />
    </>
  );
}
