import type { Metadata } from "next";

/* A branded 404: the site's ground and type, and one clear way back. */

export const metadata: Metadata = { title: "Not found | Cameron Johnson", alternates: null };

export default function NotFound() {
  return (
    <>
      <header className="site-header" data-ground="dark" data-scrolled="">
        <a className="wordmark" href="/">Cameron Johnson</a>
      </header>
      <main className="nf" aria-labelledby="nf-title">
        <p className="nf__code mono">404 · No matching object</p>
        <h1 id="nf-title" className="display nf__title">This page isn&apos;t in the directory.</h1>
        <p className="nf__copy">The address may be mistyped, or the link may be out of date.</p>
        <a className="btn btn--solid" href="/">Return to the portfolio</a>
      </main>
    </>
  );
}
