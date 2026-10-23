# Project handoff

How to resume work on Cameron Johnson's cinematic IAM portfolio. Read this file first, then
`scrollcraft/builds/cinematic-redesign/BRIEF.md`.

## Where things are

- **Repo:** `Camj78/iam-portfolio-website`. Local copy: `~/Developer/iam-portfolio-website`.
- **Branches:** `feature/cinematic-redesign` (Stages 1–8 and the launch) and `feature/aria-motion` (Stage 9, cut from
  `main`). Never merge into `main`, push to any other branch, or deploy (`vercel --prod`) without Cameron's explicit approval.
- **Kling archive (Stage 9):** `~/Developer/iam-portfolio-assets/aria-motion/`, outside the repo. The paid Kling clip, the
  approved composite and every script that made it. Never modify, move or delete it; see "A.R.I.A. head turn" below.
- **Production (live since 2026-10-22):** https://iam-portfolio-website.vercel.app, Vercel project `iam-portfolio-website`
  (team `camj78s-projects`). Vercel's Git integration deploys every push to `main` to production; other branches get
  preview deployments. See "Launch" below.
- **Dev server:** `npm run dev`, which serves http://localhost:4500. Node lives at `~/.fnm/node-versions/v20.20.0/installation/bin` (the shell may not load fnm).
- **Large pushes:** use `git -c http.postBuffer=524288000 push`.
- **Approved checkpoints:** the local tags `checkpoint/hero-approved`, `checkpoint/lifecycle-approved`, `checkpoint/validation-approved`, `checkpoint/about-approved`, `checkpoint/certifications-approved`, `checkpoint/lounge-approved` and `checkpoint/request-approved`.

## Rules that never bend

1. **CFG only.** The site shows only the Cashville Financial Group IAM lab (`Camj78/cashville-financial-group-iam`). GHOSTD must not appear anywhere on the rendered site. Its data stays unrendered in `src/content/cases.ts`.
2. **No invented claims.** Every fact comes from the résumé PDF (`public/resume`) or the CFG repository.
   - The Nissan roles were systems analysis and service planning, not IAM engineering.
   - SC-300 is **in progress, expected 2026**. Never show it as earned.
   - "Access reviews" is a GHOSTD result, so on this site it is *Learning*, not demonstrated.
3. **Phase 2 test identities:** joiner, mover and leaver were three different people (Jonathan, Sarah, David). Never show one person doing all three.
4. **Evidence images:** only the redacted copies in `public/evidence/optimized` are used. The originals in `assets-src/evidence-original` are git-ignored. The local branch `backup/pre-redaction-local` must never be pushed.
5. **Approval gates:** ask before every Kling generation (paid), every commit or push, any merge to `main`, any deploy, and before deleting files.
   - The old Desktop copy at `~/Desktop/Azure/CFG-IAM-Project/IAM Portfolio Website` stays until Cameron authorizes deleting it.
6. **Way of working:** one chapter at a time. Build it, capture screenshots, and get approval before starting the next chapter.

## Architecture

- **Stack:** Next.js 16 (App Router), React 19 and TypeScript, plus the **unmodified** Scroll Craft engine (`src/vendor/scrollcraft`, mounted by `ScrollCraftMount`). Do not edit the engine.
- **How a chapter works:** each cinematic chapter is one pinned act (`data-sc-act="pin" data-sc-span="N"`).
  - The engine pins `[data-sc-stage]`, publishes progress as `--sc-p`, fades copy (`data-sc-cue`, `data-sc-kinetic`) and drifts the dust layers (`data-sc-parallax`).
  - The chapter's component watches `--sc-p` with a MutationObserver, smooths it with a lerp, and moves the camera by setting transforms inline.
- **Reduced motion and no JS:** the component removes `data-sc-act`, and the chapter's default CSS shows a static composition.
- **Live styles** are written under `@media (prefers-reduced-motion: no-preference) { :root.js … }`.
- **Gotchas:**
  - Opacity or filter on a `preserve-3d` container flattens it, so fade the child surfaces through a CSS variable (`--o`) instead.
  - Lightning CSS drops `translate:` when the same rule also sets `transform`.
  - A CSS custom property derived with `calc()` resolves where it is declared, so set JS-driven geometry variables on the element that uses them.
- **A.R.I.A.:** three transparent poses in `public/aria/optimized` (`left`, `front` and `right`, at 760 and 480 px), blended by `src/lib/frame-player.ts`. Frame index 0 looks toward screen-left, 2 toward screen-right.
  Since Stage 9 they are the first paint and the fallback; the head turn itself is a 24-frame Kling sequence
  (`public/aria/motion`, `src/content/aria-motion.json`) drawn by the same player. See "A.R.I.A. head turn" below.
- **Navigation:** the `AccessPathRail` covers Identity through Validation and becomes a pill at the bottom of the screen at 1180px wide and below. It shows once the hero's pin lets go and fades out where About's act takes over (the shared portal frame); hidden, it is `visibility: hidden`, so it leaves the tab order and the accessibility tree. `.wrap` keeps its rail inset everywhere, so nothing moves when it goes. `SiteHeader` changes its colours based on the `data-ground` of the section underneath it.
- **Hash links and restored positions:** `lib/landing.ts`, called by `ScrollCraftMount` right after the engine mounts. See "Navigation fixes" below.

| Chapter (homepage order) | Component and styles | Status |
|---|---|---|
| Hero → Identity | `CinematicHero.tsx`, `IdentityContinuation.tsx`, `cinematic.css` | Approved; Kling head turn approved 2026-10-22 (Stage 9) |
| Privilege (CFG Phase 1) | `PrivilegeScene.tsx`, `privilege.css`, `content/privilege-scene.ts` | Approved |
| Lifecycle (CFG Phase 2) | `LifecycleScene.tsx`, `lifecycle.css`, `content/lifecycle-scene.ts` | Approved |
| Validation (evidence vault) | `VaultScene.tsx`, `vault.css`, `content/vault-scene.ts` | Approved (smoothness refactor approved 2026-10-21) |
| About | `AboutScene.tsx`, `about.css`, `content/about-scene.ts` | Approved 2026-10-21 |
| Certifications | Milestone 1 markup in `src/app/page.tsx`; SC-300 card float in `FloatCard.tsx` + `.cert__card` (globals.css) | Approved 2026-10-21 (minimal float only, no cinematic act) |
| The Access Lounge | `LoungeScene.tsx`, `lounge.css`, `content/lounge.ts`, `content/lounge-plates.json` | Approved 2026-10-21 (storyboard: `scrollcraft/builds/cinematic-redesign/LOUNGE-STORYBOARD.md`) |
| Request Access | `#contact` in `page.tsx`, `RequestRecord.tsx` (the terminal), request-access block in `globals.css` | Approved 2026-10-21 (storyboard: `scrollcraft/builds/cinematic-redesign/REQUEST-STORYBOARD.md`) |

The full case files live at `/cfg/phase-1` and `/cfg/phase-2` (`CaseStudyShell`).

## Scroll performance rules (learned on Cameron's Mac)

Cameron reviews on a 2017 MacBook Pro: Intel i5-7360U, **Intel Iris Plus 640**, Retina. Headless screenshots
at 1× cannot show GPU problems. Always measure in **headed Chrome at 2× with continuous wheel input**
(`scripts/perf-scroll.mjs`). On 2026-10-21 Validation and About went from about 14 fps to about 58 fps
in-act (p95 frame 202 ms → 17.8 ms). The root causes and their fixes, in order of impact:

1. **Large CSS-gradient surfaces in 3D get re-rasterized every frame** as the camera changes their projected
   scale. Backdrops (walls, floors, corridor, bulkhead, the exit portal) are painted once into `<canvas>`
   textures by `lib/texture.ts` / `lib/portal.ts`, and the CSS gradient stays only as a fallback (`.has-tex`).
2. **Surfaces must never reach the camera's eye plane** (their projected scale goes to infinity). Long planes
   are cut into depth segments, and segments and objects are hidden (`visibility`) before they reach the lens.
   Write `inherit`, never `visible`, so a hidden stage still hides its children. Keep focusable controls
   reachable: hidden elements cannot take focus.
3. **Lighting changes are opacity on their own layer** (`will-change: opacity`), never a `var()` inside a
   gradient or shadow, which repaints. Avoid extra full-screen translucent layers: each costs about 5 fps on this GPU.
4. **Camera paths are continuous** (`lib/camera-path.ts`, monotone cubic Hermite). Key each channel separately
   so a move is one segment between holds; per-segment easing made cameras stop mid-move. Drive objects from
   the camera's own progress.
5. **One progress source, same frame:** apply the camera inside the MutationObserver callback for the engine's
   `--sc-p` (a microtask in the engine's frame), with time-based smoothing (`follow`, τ 45 ms), never a
   per-frame lerp. Write styles through `styleWriter()` so unchanged values cause no style invalidation.
6. **No layout reads on the scroll path:** the header and rail use the cached geometry in `lib/ground.ts`.
7. **Idle loops run only in view.** An infinite CSS animation keeps the compositor producing frames even when
   it is far off screen: the SC-300 float alone took the trackpad run from 1% to 9–13% jank (about 58 → 52 fps)
   while Validation and About were on screen. Start such animations `paused` and let an IntersectionObserver
   set `data-in-view` (`FloatCard.tsx`).
8. **Photographic scenes fit their composition; they never cover the stage.** The Lounge first scaled its
   studio frame to cover the viewport: on any window narrower than the art's 1.82:1 the hosts filled 61–94% of
   the width and their heads ran into the title. Fit a key region (subjects plus props) into the space the copy
   leaves, and let dark extensions carry the room to the edges. Depth comes from near planes (desk, mics), not
   from pushing on the subjects.
9. **Warm big images at idle after load**, not when the stage approaches: decoding nine plates mid-scroll cost a
   130 ms frame. Fading copy blocks get `will-change: opacity` so soft text shadows paint once.

**Validation → About hand-off:** About's section overlaps Validation's release (`margin-top: -var(--fh)`) and
stays hidden until its own progress is above 0. Validation's exit beat (span 7 now; it ends by backing out
through the door) and About's first frame both draw the shared portal (`lib/portal.ts`), so the two stages are
pixel-identical at the switch (checked with an image diff at 1440, 834, 390 and 360 px).

## About chapter (Stage 5) in brief

- **The act:** a pinned span of 6 through a CSS 3D studio. Every world length is a px value multiplied by `--k`, and all staging lives in the `GEO` table in `AboutScene.tsx`, with separate desktop and phone setups.
- **The beats:**
  1. The first frame is the exit portal Validation ended on; the studio lights come up inside it.
  2. **Foundation:** a slab swings up off the floor.
  3. **Transition:** the camera trucks right while A.R.I.A.'s console tracks with it, the first slab recedes, and a light path draws across the floor.
  4. **Practice:** the camera pushes into the warm end of the studio, and A.R.I.A. becomes an over-the-shoulder foreground.
  5. **Close:** the personal statement and an SC-300 glow, then the pin releases onto Certifications.
- **"Read my story":** an accessible `<dialog>` (the Vault's dialog pattern) with the verified long form.
- **Scene 2 copy:** Cameron's own approved wording.
- **Hand-off to Certifications:** for now a light seam (ground continuity plus the SC-300 plate and a "Next" link). When Certifications is redesigned, the SC-300 plate can carry straight into its card.

## Verification tools

- **Smoothness (run these, not screenshots, before claiming an animation is smooth):**
  - `node scripts/perf-scroll.mjs --label <name> [--pattern trackpad,slow,wheel,fast,reverse]` runs headed GPU continuous scroll and writes frame timing to `lab/perf/<name>/`.
  - `node scripts/perf-buckets.mjs <name> trackpad` gives fps per tenth of each act.
  - `node scripts/perf-ablate.mjs --variants base,...` disables one effect at a time to find the cost.
  - `node scripts/record-scroll.mjs` records the continuous video (CDP screencast; capture itself costs this Mac about a third of its frames).
  - `node scripts/perf-chart.mjs` draws the before/after figure.
  - `node scripts/nav-check.mjs` compares the header and rail against live layout.

- **Capture any pinned act:** `node scripts/shoot-cine.mjs --act <top|privilege|lifecycle|validation|about> [--only desktop,mobile,...]`. Output goes to `lab/redesign-<act>/`.
- **Contact sheet:** `node lab/cine-sheet.mjs redesign-<act>/<viewport> <cols> <scale> [labels…]`.
- **About checks:** `node lab/ab-check.mjs` covers reduced motion, keyboard, the dialog and a GHOSTD scan. `lab/` and `review/` are git-ignored, so they are local only.
- **Before asking for approval:** run `npm run typecheck` and `npm run build`. `next dev` writes to `.next/dev`, so a build can run while the dev server is up.

## Stage 6 (Certifications) and fixes, 2026-10-21

- **Certifications:** Cameron kept the Milestone 1 layout and approved only a minimal enhancement: the SC-300
  card floats 7px on a 7 s ease-in-out cycle with a faint static green glow (CSS keyframes on `transform`,
  `will-change: transform`), off under `prefers-reduced-motion`. Status stays "In progress · expected 2026".
- **Float cost off screen (fixed):** the first version (7aaf996) ran the animation all the time; the A/B in
  rule 7 above traced the Validation/About drop to it. Now it starts paused and runs only within 25% of the
  viewport. Trackpad run: float off 57.8–59.1 fps, gated 57.9–58.6, ungated 52.1–55.2.
- **Validation crash in a zero-size viewport (fixed):** every corridor size is viewport-derived (`--cw`, `--ch`,
  `--hole` in vault.css). In a hidden or collapsed pane, tab or frame the stage lays out at 0×0, so the bulkhead
  painter's `at(hole) = 0 / 0` gave `NaN` and `addColorStop(NaN)` threw. The throw happened inside a React
  effect, so React unmounted the whole page and it stayed blank after the viewport grew. Fix: `texture()`
  (lib/texture.ts) skips painting a 0×0 surface and keeps the CSS fallback until the next measure (resize or
  ResizeObserver) paints it. It never fires at a real size: all 55 texture hosts and their pixel hashes are
  identical with and without the guard at 1440, 800×600 and 390.
- **1px horizontal overflow on phones (fixed):** the Lounge cover's amber glow (`.lounge__cover::before`,
  `inset: 8% -6% -6% 8%`) reaches 6% past the cover, past the viewport at 390 and 414 px. `body { overflow-x:
  clip }` does not contain it: with `html` at `overflow: visible`, body's overflow is propagated to the viewport
  rather than clipping body's own descendants. On a phone the layout viewport then widened to 391 px, stretching
  the fixed header. Fix: `overflow-x: clip` on `.chapter--lounge` only (clips exactly at the viewport edge, so
  nothing visible changes). Sweep: no overflow at 320–1920 px. Any new section with bleed effects needs its own clip.
  (Stage 7 replaced that cover markup; the clip stays on the Lounge section, which still carries `chapter--lounge`.)
- **Checks (lab/, local):** `cert-check.mjs` (float range/period, reduced motion), `float-gate.mjs` (paused off
  screen), `flow-scroll.mjs <WxH>` (continuous Validation → Lounge: fps per chapter, CLS, errors),
  `zero-check.mjs` (0×0 viewport), `overflow-sweep.mjs`, `tex-hosts.mjs`.

## The Access Lounge (Stage 7), approved 2026-10-21

- **The act:** pinned, span 5 (4 on phones). Flat depth planes, no CSS 3D: each plane gets one
  `translate3d() scale()` from its depth (`GEO` in `LoungeScene.tsx`). Beats: threshold (slatted wall, double
  doors, ON AIR box) → the doors slide into the wall as the camera walks through → the studio lights come up →
  reveal (title, tagline, AI-generated hosts disclosure) → two seats (slow push and truck; pillars on the desk
  front) → rundown (the studio sign changes ON AIR → IN PRODUCTION; three planned topics, "not yet recorded").
- **Framing:** a medium-wide two-shot. `KEY` (both hosts, mics, desk) is fitted below the title block with the
  hosts at about half the desktop width (`HOSTS_SHARE`); phones put the copy above and fit the hosts to the
  width. Hosts sit deep (about 6% scale change over the walk-in, ~1% after the reveal); the desk and mics carry
  the parallax. Audit: heads ≥158 px below the header and ≥67 px below the title on seven desktop sizes.
- **Assets, all from the existing cover (no generation, no Kling):** `scripts/lounge-segment.swift` (Apple
  Vision person mask, on-device) → `scripts/prepare-lounge.py` (push-pull fill of the room, hosts with the body
  filled behind the mics, mics/laptop/mug, side wings and desk front) → `public/lounge/optimized/*.webp`
  (~370 KB) and `src/content/lounge-plates.json` (positions in studio-frame px). The cover's frame cuts each
  host's outer shoulder; the wings ride on each host's plane and fall off into darkness below that cut.
- **Honesty:** the hosts are AI-generated (caption on screen in every beat that shows them, and in the alt
  text); no episodes recorded or published; the sign ends on IN PRODUCTION.
- **Hand-offs:** Certifications' ground fades over the stage's top edge as it slides in; Request Access opens
  on a gradient from the studio's floor colour.
- **Measured (Iris Plus 640, 2×, continuous wheel):** 59.9 fps forward / 60 reverse in the act, p95 17.7 ms,
  CLS 0; no horizontal overflow at 320–1920 px. Keyboard: focus in the rundown goes to p 0.95 (the engine's
  centring cannot move a sticky stage). Reduced motion and no-JS: a still with all copy, sign IN PRODUCTION.
- **Checks (lab/, local):** `lounge-shots.mjs <WxH> [p,…] [--reduce] [--out dir]`, `lounge-frame.mjs` (framing
  audit), `lounge-perf.mjs`, `lounge-a11y.mjs`, `record-lounge.mjs --out review/lounge/<stamp>/….webm`.

## Request Access (Stage 8), approved 2026-10-21

- **Composition:** Certifications' grid (`minmax(0, 1fr) minmax(0, 1.2fr)`, top hairline), about one screen tall on desktop
  (`.chapter--contact`: `min-height: 100svh` at ≥ 900 × 640). Left: `FINAL CHAPTER · CONNECT`, "Request access.", the
  statement "You've seen the controls. Now let's build something secure.", and the invitation. Right: the terminal.
- **The terminal (`RequestRecord.tsx`):** the Vault's panel material at the SC-300 card's radius. Title bar `ACCESS REQUEST`,
  one status line, then Email (the only solid button, full address shown), Copy, LinkedIn, GitHub (the CFG lab repo,
  `CFG_REPO`), Resumé (download). No record rows, ticket numbers or timestamps: ACCESS GRANTED is a metaphor, not a transaction.
  A container query (`@container (max-width: 33rem)`) puts the address under "Email" so it is never truncated.
- **Motion:** `.terminal` floats 6 px over 7.5 s (5 px at ≤ 520 px), FloatCard's pattern: paused until near view, and
  paused on `:hover` / `:focus-within`. The server renders ACCESS GRANTED; JS arms PENDING REVIEW only when motion is allowed
  and the terminal starts off screen, and resolves it once at 60% in view (dot, text crossfade, one opacity bloom on
  `.terminal::before`). Reduced motion and no-JS: granted, static. Screen readers get a fixed "Status: access granted".
- **Copy email:** Clipboard API, then a `execCommand` fallback, then a visible "Couldn't copy" with the address selectable.
  Feedback in a `role="status"` line positioned in the gap below the row (no layout shift). Hidden without JS (`:root.js`).
- **Hand-off:** the Lounge ends amber (IN PRODUCTION); the close answers emerald (ACCESS GRANTED). The studio-floor
  gradient (`.lg + .chapter--forest` in lounge.css) is unchanged. The section clips its own overflow (the bloom).
- **Spelling standard (site-wide, user-facing only):** "Resumé" / "resumé". Code identifiers, file names, URLs, code
  comments and the PDF are unchanged.
- **Link audit (2026-10-21):** all 18 GitHub links on the rendered site and in the Vault dialogs point to
  `cashville-financial-group-iam` (or the profile / site source) and return 200; every evidence path is a redacted
  `optimized/` copy; the built HTML has no GHOSTD. `ghostd-identity-governance-implementation` is the GHOSTD project, not CFG.
- **Measured (Iris Plus 640, 2×, continuous wheel, mains power):** Lounge → Request Access → page end and back 60 fps in every
  band, 8 s hold on the terminal 60 fps, max frame 17.9 ms, CLS 0; no overflow at 360–1440 px; touch targets ≥ 44 px.
  On battery below 20% macOS caps Chrome at 30 fps: plug in before measuring.
- **Checks (lab/, local):** `contact-check.mjs <WxH> [--reduce]` (grant sequence, float range, hover/focus pause, tab order,
  copy, overflow), `contact-nojs.mjs`, `contact-flow.mjs` (perf, no capture), `record-contact.mjs`.

## Navigation fixes, approved 2026-10-21

- **Direct `#hash`, refresh and back/forward (`lib/landing.ts`):** the server page is shorter than the live one (the engine
  gives the Lounge its pinned height after mount, +8,100 px at 1440 × 900), so the browser's jump to `#contact`, or its
  restore of a refreshed or returning position, landed short for anything below the Lounge. Now:
  - `rememberScroll()` tracks the last scroll position and saves it on `pagehide` per history entry
    (`navigation.currentEntry.key`, falling back to the URL). It does not read `scrollY` at `pagehide`: the page can already be
    relaying out then.
  - `land()`, called right after `ScrollCraft.mount`: on `reload` / `back_forward` it restores the saved position; otherwise it
    goes to the `#hash` element. It re-aligns on every `document.body` resize until the first wheel, touch, pointer or key
    input (or `hashchange`). No timers, no offsets.
  - The head script in `layout.tsx` sets `scroll-behavior: auto` inline on the home page for hash / reload / back-forward
    loads, so the browser does not glide through unbuilt acts; `land()` removes it on the first input.
  - Same-document jumps (header Contact, back/forward between hashes) are left to the browser.
- **Verified:** direct loads of all eight chapter hashes land at 0; refresh restores the exact spot with and without a hash;
  header Contact, back and forward; back from a case file returns to the exact position. Desktop, 390 px and reduced motion.
  Validation → About → Certifications → Lounge measured 59.4 fps (committed code 59.1 under the same conditions), CLS 0.
- **Checks (lab/, local):** `nav-hash.mjs <WxH> [--reduce]` (the full matrix; each direct load starts from `about:blank`,
  because a hash-only `goto` is a same-document jump), `nav-back.mjs`, `rail-check.mjs`, `record-rail.mjs`.
  Harness note: in the long phone matrix one "back after header" step stays put on both the old and new code; the same
  sequence passes on its own (`nav-back2.mjs`). It is the test's history stack, not the site.

## Launch, 2026-10-22

- **Resumé:** `public/resume/Cameron-Johnson-IAM-Resume.pdf` was replaced, byte for byte, with Cameron's October 2026
  PDF (supplied as `IAM Career.pdf`; Canva, 1 page, 98,327 bytes, SHA-256 `076b3b3c9bf1…0e9e07`). It has the CFG
  project "Microsoft Entra ID Identity Governance Implementation — Cashville Financial Group (CFG)" (RBAC,
  Administrative Units, JML scenarios, access certification) and no GHOSTD. Both of its project links go to
  `cashville-financial-group-iam`. The path did not change, so all 6 links on the site follow it (hero, About ×2,
  Request Access terminal, the homepage footer and both case-file footers); the terminal's screen-reader size now
  reads 96 KB. Vercel serves it with `must-revalidate`, so browsers do not keep the old copy.
- **Commits:** feature branch `db29942` (resumé, whole-site QA fixes, hero headline "Identity Secured. Access
  Governed.", Lounge tagline "Exploring identity. Challenging assumptions.", case-file heading outline, metadata, OG
  image, robots, sitemap, 404). Merged into `main` by PR Camj78/iam-portfolio-website#1 as merge commit `c34527a`
  (no squash, no force push).
- **Vercel:** production deployment `dpl_9D1KfVm9s7C2xJmUCT2ZnpdXWU5Y`, built from `main` @ `c34527a`. Status Ready,
  and aliased to https://iam-portfolio-website.vercel.app. The PR's preview build also passed.
- **Verified locally (production build, before the merge):** typecheck and build clean. Hash, refresh and
  back/forward work at 1440, 390 and with reduced motion. Real clicks reach the About plates (1440 and 390) and the
  first Vault panel. Tab order is complete. No overflow from 320 to 1920 px. All copy shows with no JS. No console
  errors or failed requests.
- **Verified live:**
  - All pages return 200, and the 404 page shows on unknown paths.
  - The live PDF hash matches the supplied file.
  - No GHOSTD on any page. All 12 GitHub URLs return 200 and point to CFG, the profile or the site source.
  - All 8 chapters appear in order at 1440, 834 and 390 (contact sheets in `review/launch/`, local).
  - No console errors or failed requests.
  - All 8 direct hash loads land at 0, including at 390 with reduced motion.
  - Back/forward restores the exact position.
  - The resumé downloads from the Request Access terminal on desktop and on phone.
- **Scripts:** `lab/launch/` (local) holds `smoke.mjs <base> <outdir> [WxH…]`, `live-hash.mjs <base> <WxH> [--reduce]`,
  `plates-390.mjs`, `sheet.mjs`, and copies of the `qa-*` checks pointed at port 4511.
  - `qa-click.mjs` uses desktop scroll offsets, so it reports false failures at 390; use `plates-390.mjs` there.
  - Playwright will not `.click()` the floating terminal (it is "not stable"). Hover first, as a person does: the float pauses on hover.
- **Not re-measured:** frame timing. The baselines above stand, and this launch changed only content, metadata and
  `pointer-events`.

- **Resumé update, 2026-10-23:** `public/resume/Cameron-Johnson-IAM-Resume.pdf` replaced, byte for byte, with Cameron's
  revised `IAM Career.pdf` (98,270 bytes, SHA-256 `12b964eb1a7f…f4f1f`). The only change from the launch copy is the
  header link, now "iamtechcam.com" instead of "IAM Portfolio". Content, path and the 96 KB label are unchanged.

## A.R.I.A. head turn (Stage 9), approved 2026-10-22

- **What changed:** an enhancement to the approved hero, not a redesign. A.R.I.A.'s turn (left at the headline → front
  to the visitor → right toward the light) is now real motion from a Kling clip instead of a dissolve between three
  stills. Headline, copy, camera, Scroll Craft timing, the Identity transition and every other chapter are unchanged.
- **Generation (one job, 75 credits, balance 587 → 512):** Kling 4.0 `image_to_video` via the Kling MCP connector,
  5 s, 1080p, one output. `first_image` = approved left, `keyframe_1` = front, `tail_image` = right, each flattened
  onto the hero colour `rgb(28 34 26)`. Output 1916×1080, 24 fps, 121 frames; the front keyframe lands at frame 74.
  Kling added two blinks (frames 20–25 and 78–83), each hiding a gaze shift. Prompt, generation id and settings are in
  the archive README. **Do not regenerate:** reuse the archive.
- **Archive:** `~/Developer/iam-portfolio-assets/aria-motion/` (269 files, 144 MB): the untouched MP4s
  (`poc-clean.mp4` SHA-256 `bf076bb8…a2bb`), Kling inputs, the three reference stills, the approved 121-frame
  composite (`composite/master/`, already in `ARIA_CROP`), the Apple Vision masks, the extraction / compositing /
  review scripts and the review sheets. Verify with `shasum -a 256 -c SHA256SUMS` in that folder.
- **Composite (approved 2026-10-22):** frames 0, 74 and 120 are the untouched approved stills. Above the collar the
  Kling head (Vision mask, background un-mixed); below it the approved stills' own pixels, dissolved between poses.
  Geometry matches the stills to ≤ 0.5 px; body drift ≤ 1 px.
- **Shipped set:** 24 frames chosen by equal head motion (`scripts/prepare-aria-motion.mjs`, reads the archive,
  never deletes). The 3 anchors reuse `public/aria/optimized/*` byte for byte; 21 in-betweens at q82 in
  `public/aria/motion/` (42 files: 1,715 KB at 760 px, 1,031 KB at 480 px). Blink frames are never shipped: each set
  keeps the open frames either side (19/26, 77/84) and the hero **cuts** between them (a saccade) instead of
  dissolving, so no scroll position shows a half-closed eye or doubled pupils. 36 frames was not visibly sharper on
  screen and slightly heavier; 48 was dropped (slower first scroll, most memory).
- **Scroll Craft integration (`CinematicHero.tsx`):** same `--sc-p`, same beats. The Kling clip carries its own easing,
  so it maps linearly: left → front over p 0.12–0.32 (Kling 0→74), front → right over 0.38–0.50 (74→120). The
  three-still player paints first; the dense set loads with low priority after `load`, at idle, and only once the hero
  is within a screen of the viewport (a `#contact` landing downloads none of it). It takes over only when the timeline
  sits on a shared still, so the switch is pixel-identical. One progress source: the frame shown is a pure function
  of scroll position, forward and reverse.
- **Fallbacks:** reduced motion and no-JS: the static poster as before (no motion requests). Save-Data or
  `deviceMemory` < 4: the three-still hero exactly as it shipped at launch.
- **Measured (Iris Plus 640, headed Chrome, mains, production build):** desktop 1440 @2× turn fps 58.4–59.1 forward,
  reverse and slow (current hero 56.0–59.4); first scroll after load 53.7–56.7 against 57.1–58.5 (first draw of each
  frame). Phone 390 @3× within the existing hero's own spread. LCP is still the poster `<img>`; the first motion
  request follows the load event. Decoded memory about +60 MB desktop / +24 MB phone.
- **Known minor limitations (accepted):** (1) the approved stills carry about twice Kling's fine felt detail, so the
  texture firms up over ~25 px of scroll as A.R.I.A. lands on the front still (left and right ease in over the
  composite's cross-faded ends); (2) at cut 1 the face also rotates slightly in the same frame as the gaze shift.
- **Checks (lab/, local):** `aria-qa.mjs [base]` (reduced motion, Save-Data, deep link, first paint, invisible
  takeover, determinism, exact anchors, blink frames, overflow, tab order), `aria-perf.mjs --label x [--baseline]
  [--size 390x844 --dpr 3]` + `aria-perf-table.mjs`, `record-aria.mjs`, `aria-flipbook.mjs` (frame-exact head
  close-ups), `stage9-hash.mjs`. Recordings in `review/aria/`.

## Mobile: the lightweight home page (Stage 11, 2026-10-23)

iPhone Safari and Chrome showed "A problem repeatedly occurred" on the live site. Stage 10 isolated it on a physical
iPhone (iOS 26.6.2) over a LAN diagnostic proxy (`lab/stage10b/`, logs and READMEs there): plain HTML, React
hydration, the shared shell and the hero alone all pass; every route with a 3D chapter crashes. The Validation scene
crashed even as static HTML with no React, no animation, no images and no filters, the moment its 3D geometry was
shown. No iOS crash or Jetsam log was available, so the mechanism inside WebKit is not known.

Decision: phones and tablets get a separate lightweight page; desktop is untouched.
- **Gate (`src/proxy.ts`, `src/lib/view.ts`):** before any HTML is sent, `/` is rewritten to `/m` for phones and
  tablets (User-Agent, `Sec-CH-UA-Mobile`), or when the `view` cookie says `lite`. `?view=lite|full` sets the cookie.
  The URL stays `/`. Each page is static and hydrates its own markup.
- **Safety net (`LITE_GUARD`, first element of `/`):** a touch-first device that still received the cinematic page
  (iPadOS asks for desktop sites with a Mac User-Agent) sets `view=lite`, stops loading and reloads before hydration.
- **`/m` (`src/app/m/page.tsx`, `src/components/LiteChapters.tsx`, `src/app/lite.css`):** same chapters, order, copy,
  evidence and links, from the same content modules; 2D only (no 3D context, canvas, scene effects, engine or motion
  frames). Certifications, Request access and the footer are shared with `/` (`SharedSections.tsx`). Entrances
  (`LiteReveal`) never hide content before hydration and are off under reduced motion. Canonical is `/`.
- **Desktop unchanged:** server markup identical to the previous build apart from the guard script; identical layer
  counts at every chapter (`npm run guard:mobile -- <base> --baseline <url>`, 27 checks).
- **Not changed:** the `/cfg` case files (2D already; checked on an emulated iPhone).

## Open items (Cameron)

1. **Access reviews, site vs. resumé:** the new resumé lists Access Reviews and says the CFG project "developed an
   access certification workflow". The site still files "Access reviews and certification" under *Learning*
   (rule 2 above), because the CFG lab repository had no access-review evidence when the site was written. If the CFG
   repo now documents that work, the Validation tiers, skills and case files can be updated, but only with Cameron's
   approval and from the repository's evidence.
2. **Resumé "IAM Portfolio" link** goes to the CFG GitHub repo, not to this website. Cameron's call; the PDF is never edited here.
3. **Email and LinkedIn:** the site is live with camjohnson78@gmail.com. Cameron still needs to verify the LinkedIn URL by hand.
4. **Site source:** the footer links to this public repo, whose `cases.ts` still holds GHOSTD data (unrendered). Keep or strip?
5. **Minor:** the Access Path rail is not in the forward Tab order from the top (a structural fix, needs approval).
6. **Local only:** untracked leftovers (`public/lounge/optimized/lounge-edge-l/r.webp`, `assets-src/lounge/composite.jpg`)
   and `.claude/` stay uncommitted; ask before deleting. The old Desktop copy stays until Cameron authorizes deleting it.
7. **A.R.I.A. front-pose texture (optional):** if the texture change at the front still ever matters, the options are a
   light sharpen of the Kling in-betweens or carrying the still's fine detail into the frames next to it. Both change
   the approved look, so only with Cameron's approval, and from the archive, never a new generation.
