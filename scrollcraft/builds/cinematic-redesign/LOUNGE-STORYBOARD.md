# The Access Lounge: storyboard (Stage 7, for approval)

Status: **approved and built (2026-10-21)** with the four recommended defaults. What shipped differs in
detail (a medium-wide two-shot rather than a push toward the hosts, the disclosure in its own corner, the
rundown as cards); PROJECT_HANDOFF.md "The Access Lounge (Stage 7)" describes the built chapter.

## Intent

Scrolling out of Certifications should feel like stepping off a corridor into a premium podcast studio
after hours: deep navy room, warm amber practicals, a blue slatted wall, and the two hosts from the
existing cover sitting at their mics. Depth and light do the storytelling; text stays to a handful of
words per beat. The chapter stays honest: **no episodes are published yet**, and nothing on screen may
suggest a live or released show.

## Visual language (from the cover, nothing invented)

| Element | Source in the cover | Role in the scene |
|---|---|---|
| Navy room, `--lounge` #0a1326 | background | the ground the whole act sits on |
| Blue slatted acoustic wall, left | left third | far plane, cool rim light |
| Warm shelves, globe, plant, amber strip lights, right | right third | far plane, warm practicals |
| "ON AIR" light box | upper right | the act's light cue (see decision 3) |
| Desk, two broadcast mics on arms, laptop, Access Lounge mug | foreground | the near plane the camera pushes over |
| Host 1 (left, black hoodie, headphones) and Host 2 (right, olive jacket, curly hair, headphones) | the two hosts | two separate mid planes at different depths |
| Amber #f3ab3c + emerald hand-off | title, sign | accent; amber replaces the site's green here |

## The act: one pinned span of 5, desktop

Planes, back to front: **L0** navy room + slatted wall + shelves (one canvas texture, painted once) ·
**L1** practical lights (opacity-only layers) · **L2** Host 2 (farther, right) · **L3** Host 1 (nearer,
left) · **L4** desk, mics and mug (foreground, fastest plane) · **L5** type and captions (flat, not in 3D).

### Beat 0 · Threshold (p 0.00–0.15)
- **Frame:** Certifications releases onto a dark studio door: a matte navy wall with a small, unlit
  "ON AIR" box above a narrow seam of warm light. The ground shifts from charcoal green to navy over the
  last half-viewport of Certifications (one gradient seam, no extra full-screen layer).
- **Text:** kicker only: `THE PODCAST`.
- **Motion:** none yet; the pin settles.

### Beat 1 · On air (p 0.15–0.35)
- **Frame:** the ON AIR box warms up (amber, opacity fade), then the door's two acoustic panels slide
  apart and the camera dollies through the gap.
- **Text:** none.
- **Motion:** one continuous camera move (depth only), the panels exit sideways before reaching the lens
  (the Vault's culling rule).

### Beat 2 · The studio (p 0.35–0.60), the emotional peak
- **Frame:** the wide establishing shot. Blue slats on the left, warm shelves on the right, the desk
  across the bottom, both hosts at their mics. Host 1 nearer on the left, Host 2 a step back on the right,
  so the camera move separates them in depth. Dust motes in the lamp light (sparse, transform-only).
- **Text:** the title, very large: **The Access Lounge**, and the tagline in mono:
  `Identity. Cybersecurity. Real conversations.`
- **Motion:** a slow push in with a slight truck right; the hosts parallax against the room.

### Beat 3 · Two seats (p 0.60–0.80)
- **Frame:** the camera settles over the desk between the two mics, hosts framed left and right.
  The four pillars from the cover sit on the desk edge as small lit placards:
  `People · Technology · Security · Opportunity`.
- **Text:** one line of intro, shortened from the current copy:
  "A planned podcast about how access really gets granted, reviewed and removed."
- **Motion:** micro push only; placards fade up in order (opacity).

### Beat 4 · The rundown (p 0.80–1.00)
- **Frame:** the camera tilts down onto the desk; a printed show rundown lies by the laptop with the three
  planned topics as cue cards, each stamped **Planned · not yet recorded**. The status line reads
  **In production. No episodes published yet.** The ON AIR box dims (decision 3).
- **Text:** the three titles from `content/lounge.ts`, unchanged.
- **Motion:** tilt and settle, then the pin releases onto Request Access (forest ground), with the desk
  lamp's warm edge carried across the seam.

## Phone composition (separate staging, not a scaled desktop)

- Span of 4; portrait framing. Host 1 large in the foreground (cropped at the shoulder, lower left), Host 2
  smaller and higher on the right, the ON AIR box top right.
- Beat 1 is a straight dolly (no panel slide). Beats 3 and 4 stack: pillars as one mono line, the rundown
  as three short cards in flow after the pin releases (no long text inside the pinned act).

## Reduced motion

A single composed still of Beat 2 (the studio wide shot) with all copy, pillars and the three planned
topics in normal flow below. No pin, no dolly, the ON AIR box static.

## Performance budget (the Iris Plus 640 rules from PROJECT_HANDOFF.md)

- At most **six 3D planes**. The room (L0) is one canvas texture painted once per resize (`lib/texture`);
  no CSS gradients on moving 3D surfaces.
- Lighting is **opacity on its own layer** only (ON AIR, lamp pools). No animated `filter`, `blur` or
  `box-shadow`; at most one translucent full-screen layer.
- Host and desk plates are pre-cut WebP/AVIF with alpha, sized to their largest on-screen size at 2×.
- One continuous camera path (`lib/camera-path.ts`), driven from the engine's `--sc-p` in the same frame.
- Planes are culled before they reach the eye plane. Video is not used.
- Acceptance: `scripts/perf-scroll.mjs` trackpad pattern ≥ 55 fps in-act at 1440×790@2×, no layout shift,
  no horizontal overflow at 320–1920 px.

## Assets needed

- **Room plate (text-free):** the cover has the title, icons and the pillar bar baked in, so the room has
  to be rebuilt: either painted in canvas from the cover's palette (free) or generated (decision 1).
- **Host cut-outs:** two alpha plates. The cover source is 1254 px square, so each host is roughly 500 px
  wide: sharp as mid planes on desktop, too soft for a full-height close-up.
- **Desk plate:** mics, laptop and mug, cut from the cover or rebuilt.

## Open decisions for Cameron

1. **Host and room imagery.**
   (A, recommended) Cut both hosts and the desk out of the existing cover; build the room in canvas from
   its palette. No cost, and the faces match the cover exactly; the camera stays medium-wide to respect
   the resolution.
   (B) Generate higher-resolution host plates and a text-free studio plate with Kling, using the cover as
   reference. Paid (needs your approval per generation), sharper, but faces may drift from the cover.
2. **AI disclosure.** The hosts are AI-generated. Recommend a small mono caption in Beat 2,
   `AI-generated hosts`, so nothing implies two real people have recorded a show.
3. **ON AIR sign.** Recommend it warms in Beat 1 as atmosphere, then reads **IN PRODUCTION** (or dims) in
   Beat 4, so the chapter ends on the honest status rather than "live".
4. **Length.** Span 5 on desktop / 4 on phone (About is 6). Shorter keeps the page brisk before Contact.
