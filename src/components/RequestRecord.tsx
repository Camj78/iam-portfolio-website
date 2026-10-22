"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { CFG_REPO } from "@/content/identity-scene";

/**
  The close: an ACCESS GRANTED terminal. The status is a metaphor, not a transaction.

  The server renders the granted state, so no-JS, reduced motion and slow hydration all show
  it with every action live. Only when motion is allowed and the terminal starts off screen
  does JS arm "pending review"; the first time it is 60% in view it resolves to granted once.
  The float is FloatCard's pattern (globals.css, .terminal): CSS keyframes, run only near view.
*/
export function RequestRecord() {
  const ref = useRef<HTMLDivElement>(null);
  const [copy, setCopy] = useState<"" | "done" | "failed">("");

  useEffect(() => {
    const el = ref.current!;
    const near = new IntersectionObserver(([e]) => el.toggleAttribute("data-in-view", e.isIntersecting), { rootMargin: "25% 0px" });
    near.observe(el);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => near.disconnect();

    let timer = 0;
    let first = true;
    const grant = new IntersectionObserver(([e]) => {
      // Already on screen at load (a #contact link): stay granted rather than flash back to pending.
      if (first) { first = false; if (e.isIntersecting) { grant.disconnect(); return; } el.dataset.state = "pending"; }
      if (e.intersectionRatio >= 0.6) { grant.disconnect(); timer = window.setTimeout(() => { el.dataset.state = "granted"; }, 600); }
    }, { threshold: [0, 0.6] });
    grant.observe(el);
    return () => { near.disconnect(); grant.disconnect(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!copy) return;
    const t = window.setTimeout(() => setCopy(""), copy === "done" ? 2400 : 6000);
    return () => clearTimeout(t);
  }, [copy]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopy("done");
    } catch {
      // Clipboard API refused (permissions, insecure context): fall back to a selected textarea.
      const ta = document.createElement("textarea");
      ta.value = profile.email;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
      setCopy(ok ? "done" : "failed");
    }
  }

  return (
    <div ref={ref} className="terminal">
      <div className="terminal__panel">
      <div className="terminal__bar">
        <span className="mono">Access request</span>
        <span className="terminal__led" aria-hidden="true" />
      </div>

      <p className="terminal__status">
        <span className="sr-only">Status: access granted</span>
        <span className="terminal__state" aria-hidden="true">
          <span className="pending">Pending review</span>
          <span className="granted">Access granted</span>
        </span>
      </p>

      <div className="terminal__primary">
        <a className="btn btn--solid terminal__email" href={`mailto:${profile.email}`}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14v10H3z M3 5l7 6 7-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          <span>Email</span>{" "}
          <span className="terminal__addr">{profile.email}</span>
        </a>
        <button type="button" className="btn btn--ghost terminal__copy" onClick={copyEmail} aria-label="Copy email address">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            {copy === "done"
              ? <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M7 7h9v9H7z M4 13V4h9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />}
          </svg>
          <span>Copy</span>
        </button>
        <p className="terminal__note" role="status" data-kind={copy || undefined}>
          {copy === "done" && "Email copied"}
          {copy === "failed" && <>Couldn&rsquo;t copy. The address is <span className="terminal__sel">{profile.email}</span></>}
        </p>
      </div>

      <div className="terminal__links">
        <a className="btn btn--ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn<span className="sr-only"> profile (opens in a new tab)</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 13l6-6 M8 7h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        <a className="btn btn--ghost" href={CFG_REPO} target="_blank" rel="noopener noreferrer">
          GitHub<span className="sr-only">: Cashville Financial Group IAM lab repository (opens in a new tab)</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 13l6-6 M8 7h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        <a className="btn btn--ghost" href={profile.resume} download>
          Resumé<span className="sr-only"> (PDF, 96 KB, downloads)</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v9 M6 9.5l4 4 4-4 M5 16h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </div>
      </div>
    </div>
  );
}
