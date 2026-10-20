"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";

/** The close: an access request that resolves to approved once it is fully in view. */
export function RequestRecord() {
  const ref = useRef<HTMLDivElement>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setApproved(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setApproved(true), 650); io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="record" data-approved={approved ? "" : undefined}>
      <dl>
        <dt>Resource</dt><dd>Cameron Johnson, Identity &amp; Access Management</dd>
        <dt>Requested by</dt><dd>Recruiters, hiring managers, collaborators</dd>
        <dt>Access</dt><dd>Conversation about IAM Analyst, IAM Engineer and identity governance roles</dd>
        <dt>Status</dt>
        <dd aria-live="polite">
          <span className="state">
            <span className="pending">Pending review</span>
            <b className="approved">Approved</b>
          </span>
        </dd>
      </dl>
      <div className="record__actions">
        <a className="btn btn--solid" href={`mailto:${profile.email}`}>Email</a>
        <a className="btn btn--ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a className="btn btn--ghost" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        <a className="btn btn--ghost" href={profile.resume} download>Résumé (PDF)</a>
      </div>
    </div>
  );
}
