# Request Access: storyboard (Stage 8, for approval)

Status: **approved and built (2026-10-21)** with Cameron's Phase B refinements, which supersede parts of this storyboard:
the Resource / Requested by / Scope rows were removed (the terminal is the title bar, one status line and the actions);
the label is `FINAL CHAPTER · CONNECT`; GitHub goes to the CFG lab repo; Copy email was added; the float pauses on hover
and focus. PROJECT_HANDOFF.md "Request Access (Stage 8)" describes the built chapter.

Direction (approved by Cameron): **hybrid**. The two-column composition of Certifications, with an
ACCESS GRANTED security terminal in the card's place. It is the simplest chapter on the site and the
one built to convert: every action is a plain, real link that works before, during and without any animation.

## What exists today (Milestone 1)

- `src/app/page.tsx` `#contact`: a `.request` grid (1fr / 1fr), an oversized "Request access." headline
  (`clamp(3rem, 8vw, 7.5rem)`), a lede, and `RequestRecord.tsx`.
- `RequestRecord.tsx`: a definition list (Resource / Requested by / Access / Status) whose status flips
  from "Pending review" (felt-tan dot) to "Approved" (emerald) 650 ms after the card is 60% in view;
  under reduced motion it shows Approved at once. Four buttons: Email (solid), LinkedIn, GitHub, Résumé.
- Ground: `.chapter--forest` (`--forest-2` #101915). `lounge.css` already opens it on the studio floor:
  `linear-gradient(#03050a → --forest-2 over min(32vh, 18rem))`.
- Problems to fix: the headline dominates the card; the card has no relationship to Certifications'
  composition; with no JS the status stays "Pending review" forever; `aria-live` announces the flip as
  the user scrolls, which is noise for screen-reader users.

## Verified facts used (nothing else)

| Item | Value | Verified against |
|---|---|---|
| Email | camjohnson78@gmail.com | Résumé PDF header, `profile.ts` |
| LinkedIn | https://www.linkedin.com/in/cameron-johnson615/ | Résumé PDF header (LinkedIn refuses automated checks, HTTP 999) |
| GitHub profile | https://github.com/Camj78 | HTTP 200 |
| CFG lab repo | https://github.com/Camj78/cashville-financial-group-iam | HTTP 200 |
| Résumé | `/resume/Cameron-Johnson-IAM-Resume.pdf`, 95 KB, 1 page | file on disk |
| Target roles | IAM Analyst, IAM Engineer, identity governance | existing approved copy |
| SC-300 | In progress, expected 2026 | résumé, handoff rule 2 |

## 1 · Desktop composition (1440 × 900 reference)

Same grid as Certifications: `minmax(0, 1fr) minmax(0, 1.2fr)`, gap `clamp(2rem, 5vw, 5rem)`, a hairline
rule across the top with `--sc-7` above the content, `.wrap` with the rail inset. The two columns are
vertically centred on each other (Certifications aligns top; here the terminal is the visual weight, so
it sits on the copy's centre line). The section is about one viewport tall, not forced.

```
  ┌── studio floor #03050a ─────────────── fades to forest-2 over 32vh ───────────────────────┐
  │                                                                                           │
  │  ─────────────────────────────────────────────────────────────────────────── hairline     │
  │                                                                                           │
  │  REQUEST ACCESS · THE CLOSE (mono kicker)       ┌─ access request ─────────────  ● ─┐     │
  │                                                 │  ● ACCESS GRANTED                  │     │
  │  Request access.            (display, ~5rem)    │  ────────────────────────────────  │     │
  │                                                 │  Resource      Cameron Johnson     │     │
  │  You've seen the controls.                      │  Requested by  Recruiters, hiring  │     │
  │  Now let's build something secure.  (t-xl)      │                managers, IAM pros  │     │
  │                                                 │  Scope         IAM Analyst · IAM   │     │
  │  Hiring for IAM Analyst, IAM Engineer or        │                Engineer · IGA      │     │
  │  identity governance? Working in identity       │  ────────────────────────────────  │     │
  │  security and want to compare notes? Email      │  [ ✉  camjohnson78@gmail.com  → ] ⧉│     │
  │  is the fastest route. (lede, ink-soft)         │  [ LinkedIn ↗ ]   [ GitHub ↗ ]     │     │
  │                                                 │  [ Résumé · PDF · 95 KB  ↓ ]       │     │
  │                                                 └────────────────────────────────────┘     │
  │                                                     soft emerald under-glow, deep shadow   │
  └───────────────────────────────────────────────────────────────────────────────────────────┘
   footer (unchanged)
```

Hierarchy, top to bottom: headline → statement → status light → email → secondary links → invitation.
The email action is the single solid (emerald) control on the page; everything else is ghost.

## 2 · Exact proposed copy

**Left column**

- Kicker (mono, `--sc-accent`): `REQUEST ACCESS · THE CLOSE`
- Headline (`h2#contact-title`, display, stretch 118%): **Request access.**
  (sentence case with a full stop, like every other display line on the site; see decision 6)
- Statement (t-xl, `--sc-ink`, two balanced lines): **You've seen the controls. Now let's build something secure.**
- Invitation (lede, `--sc-ink-soft`, max 44ch):
  *Hiring for IAM Analyst, IAM Engineer or identity governance? Working in identity security and want to
  compare notes? Email is the fastest route, and the résumé has the full history.*

**Terminal**

- Title bar (mono, ink-soft): `access request` on the left; a small status LED on the right.
- Status line (mono, emerald, letter-spaced): `● ACCESS GRANTED`
- Record (definition list, three rows; Status moves up into the status line):

  | Term | Value |
  |---|---|
  | Resource | Cameron Johnson, Identity & Access Management |
  | Requested by | Recruiters, hiring managers and IAM practitioners |
  | Scope | IAM Analyst · IAM Engineer · identity governance |

- Actions:
  - Primary (solid emerald, full width): `Email` label + the address `camjohnson78@gmail.com` in mono,
    `mailto:` link. Accessible name: "Email Cameron at camjohnson78@gmail.com".
  - Copy (small square icon button beside it, optional, decision 5): copies the address; a polite live
    region says "Email address copied". Covers visitors whose browser has no mail client.
  - `LinkedIn ↗` (ghost) – new tab, name "LinkedIn profile (opens in a new tab)".
  - `GitHub ↗` (ghost) – target per decision 2, name says where it goes and that it opens a new tab.
  - `Résumé · PDF · 95 KB ↓` (ghost, full width) – `download`, name "Download résumé, PDF, 95 KB".

No ticket numbers, timestamps, IP addresses, fake session IDs or "encrypted" claims: the terminal is a
styled record, not a simulation.

## 3 · Security terminal design

An extension of the Evidence Vault's panels, calmer and flatter:

- **Surface:** the Vault panel gradient `rgb(26 39 32 / .92) → rgb(14 22 18 / .94)`, radius `--sc-r-lg`
  (20 px, same as the SC-300 card), 1 px border in `rgb(102 199 147 / .28)`.
- **Depth:** `inset 0 1px 0 rgb(236 231 220 / .1)` top edge, `0 24px 48px -20px rgb(0 0 0 / .9)` drop,
  and the same faint emerald under-glow as the SC-300 card (`0 28px 64px -30px accent 30%`). Painted once.
- **Title bar:** a 1 px hairline below it; mono xs, ink-soft. No traffic-light dots, no fake window chrome.
- **Status line:** mono, 0.82 rem, 0.16 em tracking (the Vault's group-label style), emerald `#66c793`
  on the panel (contrast 7.5:1). The LED is a 9 px dot (today's `.state::before`) with a 2-ring halo.
- **Record:** two-column `dl`, hairline rows (as in `.domains` / `.record`), terms ink-soft, values ink.
- **Buttons:** the site's `.btn` system unchanged (pill radius, 2.9 rem min-height, 160 ms colour
  transitions, `:active` scale 0.97). Focus ring is the global 2 px emerald outline, offset 3 px.
- **Width:** ~30–34 rem on desktop; never wider than the SC-300 card was in its column.

## 4 · Animation and interaction

| What | Behaviour | Cost |
|---|---|---|
| Float | `translate3d(0, -6px, 0)` at 50%, **7.5 s** ease-in-out cycle, `will-change: transform`. Reuses `FloatCard` (starts paused; runs only within 25% of the viewport). Pauses on `:hover` / `:focus-within` so a target never moves under the pointer or a focus ring. | one composited layer, zero layout |
| Grant (once) | When the terminal is 60% in view: LED felt-tan → emerald, the line crossfades `PENDING REVIEW` → `ACCESS GRANTED` (300 ms), and one emerald bloom behind the terminal rises to 1 and settles at 0.35 over ~900 ms. Never repeats on scroll back. | opacity on its own layer only (handoff rule 3) |
| Links | No motion of their own beyond the existing hover colour and press scale. | – |

- **Rendering order:** the server renders the granted state. JS arms the pending state only when motion
  is allowed and the terminal has not yet been seen, so no-JS, reduced motion, slow JS and print all show
  ACCESS GRANTED with every link live. Animation never gates an action.
- **Screen readers:** the status is read as static text ("Status: access granted"); the pending/granted
  crossfade is `aria-hidden`. No `aria-live` on scroll (today's announcement goes away).
- **Reduced motion:** no float, no bloom, granted from the start. Static glow stays.
- **No pinning, no 3D camera, no zoom, no entrance sequence, no Scroll Craft act.** The section keeps
  `data-sc-in` reveal only if Certifications uses it (it does: the same gentle fade-up).

## 5 · Tablet and mobile

| Width | Layout |
|---|---|
| ≥ 1181 px | As above, rail inset in `.wrap`. |
| 900–1180 | Two columns, ratio 1fr / 1fr, terminal min 22 rem. Headline steps down to ~4 rem. |
| 421–899 | Stacked: kicker, headline, statement, invitation, then the terminal at full width (max 36 rem, left aligned with the copy). Float 6 px. |
| ≤ 420 | Stacked; the record's rows put the term above the value; actions single column (Email, LinkedIn, GitHub, Résumé), each ≥ 44 px tall. Email address wraps cleanly. Float 5 px. |

- The section gets its own `overflow-x: clip` (handoff: any section with bleed effects clips itself) so the
  bloom never widens the viewport. Sweep target: no overflow at 320–1920 px.
- The footer's bottom padding already clears the phone pill rail; I will confirm the rail is hidden here.

## 6 · Accessibility and performance

- Contrast against the panel's lightest stop (#1a2720, worst case): ink #ece7dc 12.6:1; ink-soft #a9b3a8
  7.2:1; emerald #66c793 7.5:1; solid button text #0c1310 on #66c793 9.1:1. All pass WCAG AAA for body text.
- Tab order: email → copy → LinkedIn → GitHub → résumé → footer. Visible focus on every control. External
  links say they open a new tab; the résumé says it downloads and its size.
- Landmarks stay as now: `<section aria-labelledby="contact-title">`; `#contact` anchor unchanged, so the
  header's Contact button and every existing link keep working.
- No new images, fonts, canvases or libraries; no new assets generated; no Kling. One idle transform loop
  (gated), one one-shot opacity layer. Target on the Iris Plus 640: Lounge → Request Access continuous
  scroll at the Lounge's ~60 fps, CLS 0 (transform-only float cannot shift layout).
- Verification before review: `npm run typecheck`, `npm run build`, headed 2× `perf-scroll` through the
  Lounge into the close, a continuous recording, keyboard pass, reduced-motion and no-JS stills, overflow
  sweep, GHOSTD scan of the rendered DOM, and screenshots at 1440, 1280, 1024, 834, 390 and 360.

## 7 · Transition from The Access Lounge

The Lounge ends on a status sign: **ON AIR → IN PRODUCTION**, in amber. Request Access answers it with
another status change: **PENDING REVIEW → ACCESS GRANTED**, in emerald. The ground already carries the
studio floor (#03050a) into forest green over the first 32vh, so the eye leaves a dark room and arrives
at a single lit object. Amber hands back to the site's emerald, the vault's panel material returns, and
the composition is Certifications' again: calm, two columns, one floating object. Nothing in the
Lounge's code changes; the seam rule `.lg + .chapter--forest` stays as it is.

## Files that would change (Phase B, after approval)

- `src/app/page.tsx` – only the `#contact` section markup.
- `src/components/RequestRecord.tsx` – becomes the terminal (or a new `AccessTerminal.tsx`; same idea).
- `src/app/globals.css` – the `request access` block only (the `.request` / `.record` rules).
- Untouched: every approved chapter, the Scroll Craft engine, `SiteHeader`, `AccessPathRail`, the footer.

## Decisions for Cameron

1. **Résumé PDF mentions GHOSTD.** The downloadable résumé (already linked in the footer and the current
   close) has a "GHOSTD Corporation" project section and lists Access Reviews. The site's rule is CFG only.
   Options: keep the résumé as your authentic document, or give me an updated PDF to swap in. I will not
   edit the PDF myself.
2. **GitHub target.** Your profile (github.com/Camj78) publicly lists `ghostd-identity-governance-implementation`
   and the CostGuard repos. Recommend: the terminal's GitHub link goes to the **CFG lab repo**
   (`Camj78/cashville-financial-group-iam`) labelled "GitHub · CFG IAM lab"; the footer keeps the profile.
3. **Email.** `profile.ts` marks camjohnson78@gmail.com as "pending Cameron's confirmation before any
   public deploy". Confirm it is the address you want on the live site.
4. **LinkedIn.** The URL matches your résumé exactly, but LinkedIn blocks automated checks. Please click it
   once in the review build to confirm.
5. **Copy-email button.** Recommend yes (a small icon button beside Email). It is the only extra control.
6. **Headline casing.** "Request access." in sentence case like the rest of the site (recommended), or
   all caps "REQUEST ACCESS" as written in your brief.
7. **Phone number.** It is on the résumé; recommend leaving it off the page.
8. **Kicker.** `REQUEST ACCESS · THE CLOSE`, or drop the kicker entirely for an even simpler column.
