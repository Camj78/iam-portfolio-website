# Cameron Johnson — IAM Portfolio

Cinematic Identity & Access Management portfolio: "The Case File".
Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Motion, and the unmodified
Scroll Craft engine (`src/vendor/scrollcraft`).

## Run

```bash
npm install
npm run dev          # http://localhost:4500
npm run build        # static production build
```

## Structure

| Path | What it is |
|---|---|
| `src/content/` | All copy and facts (profile, case studies, skills, podcast). Sourced from the résumé and public GitHub repos only. |
| `src/components/AriaHero.tsx` | A.R.I.A.'s scroll-driven stage (the signature interaction) |
| `src/lib/frame-player.ts` | Transparent frame-sequence canvas player used by the hero |
| `src/components/` | Rail navigation, case files, evidence lightbox, skills ledger, contact record |
| `assets-src/` | Read-only source copies of the original assets. Never modified. |
| `scripts/prepare-assets.mjs` | Non-destructive: writes optimized copies to `public/**/optimized/` only |
| `scripts/shoot.mjs` | Screenshot verification across viewports and reduced motion |
| `scripts/check-interactions.mjs` | Keyboard, lightbox, filters, links, reverse-scroll checks |
| `scrollcraft/builds/case-file/BRIEF.md` | Creative brief, grammar, feeling curve |

## A.R.I.A. frames

Milestone 1 uses the three approved stills (left, front, right). The Kling-generated
turn will replace `FRAMES` in `AriaHero.tsx` with a dense transparent sequence;
the player and choreography stay the same.
