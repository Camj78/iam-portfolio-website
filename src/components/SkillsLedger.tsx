"use client";

import { useState } from "react";
import { skills, statusCopy, type SkillStatus } from "@/content/skills";

const FILTERS: (SkillStatus | "all")[] = ["all", "demonstrated", "learning", "next"];

/** Every skill carries its status and, where it exists, a link to the evidence. */
export function SkillsLedger() {
  const [filter, setFilter] = useState<SkillStatus | "all">("all");
  const rows = filter === "all" ? skills : skills.filter((s) => s.status === filter);
  const count = (f: SkillStatus | "all") => (f === "all" ? skills.length : skills.filter((s) => s.status === f).length);

  return (
    <div>
      <div className="ledger-head">
        <p className="lede" style={{ fontSize: "var(--sc-t-base)", color: "var(--sc-ink-soft)", maxWidth: "52ch" }}>
          <strong style={{ color: "var(--sc-ink)" }}>Demonstrated</strong> means built and evidenced in a case file.{" "}
          <strong style={{ color: "var(--sc-ink)" }}>Learning</strong> means in SC-300 study, not yet evidenced.{" "}
          <strong style={{ color: "var(--sc-ink)" }}>Next</strong> means a planned objective.
        </p>
        <div className="filters" role="group" aria-label="Filter skills by status">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : statusCopy[f].label}
              <span className="count">{count(f)}</span>
            </button>
          ))}
        </div>
      </div>
      <table className="ledger">
        <caption className="sr-only">IAM skills with status and evidence</caption>
        <thead>
          <tr><th scope="col">Skill</th><th scope="col">Area</th><th scope="col">Status</th><th scope="col" style={{ textAlign: "right" }}>Evidence</th></tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td className="area">{s.area}</td>
              <td className="st"><span className={`status status--${s.status}`}>{statusCopy[s.status].label}</span></td>
              <td className="ev">
                {s.evidence ? <a className="link" href={s.evidence.href}>{s.evidence.label}</a> : <span style={{ color: "var(--sc-ink-soft)" }}>None yet</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
