# FIGURE / GROUND — HANDOFF v1.6.1

Generative black & white ambiguity tool. Single-file HTML/JS, no build step.
Joe.K · axisbim.io

**Live:** [blackwhitefigurestudies.netlify.app](https://blackwhitefigurestudies.netlify.app)
**Repo:** [github.com/JoeK212/figuregroundv1](https://github.com/JoeK212/figuregroundv1)

## Files this version produces
- `index.html` — the site
- `audit_deploy.js` — static QA pass, 85 checks, run with `node audit_deploy.js`
- `netlify.toml` — Netlify deploy config (added post-v1.6.1, no app code
  changed — see Deployment section below)
- `HANDOFF_v1.6.1.md` — this file

## What changed this version (v1.6.1, patch on top of v1.6.0)

Fixed washed-out black/white contrast in the 3D view — reported via
screenshots showing extruded Truchet shapes reading as uniform light gray
regardless of relief height, in both the normal and page-inverted states.

Root cause: `inkMat` and `paperMat` (the two `MeshStandardMaterial`s used
for every extruded shape and the base plate) never set `metalness`
explicitly. Three.js r128's `MeshStandardMaterial` defaults metalness to
0.5 when left unset — confirmed against period-accurate docs for that
release, since newer Three.js versions default it to 0. At metalness 0.5,
even a near-black albedo (`0x0A0A0A`) gets a strong Fresnel-driven specular
response under the scene's overhead directional light, so top faces caught
enough reflected light to read as light gray/near-white instead of black.
That made it genuinely hard to tell which extruded shapes were "ink" vs
seeing through to the "paper" base plate, independent of relief height —
matches exactly what the screenshots showed.

Fix: both materials now set `metalness:0` explicitly. This is also just
the physically correct value — ink and paper are both matte, fully
non-metallic surfaces; nothing in this scene should have a metallic
specular response at all.

### Also in this handoff (v1.6.0, carried over)

**Mobile footer fix.** The version credit was disappearing below 720px —
not truly "cut off" by CSS clipping, but hidden entirely
(`.footer-credit{display:none;}`). The underlying reason it was hidden in
the first place: `.footer-credit` lives inside `.bar`, which is a
horizontally-scrolling control row (`overflow-x:auto`) with
`margin-left:auto` pushing the credit to the far right end — on a narrow
viewport it sat past the visible control groups, invisible without
scrolling all the way right. Fix: added a dedicated `.footer-credit-mobile`
row as a sibling of `.bar` (not inside its scrollable area), hidden on
desktop and shown only below 720px, so the version string is always
visible on mobile without needing to scroll anywhere. Both `#appVersion`
and the new `#appVersionMobile` span get set from `APP_VERSION` on load.

**Attractor tunability.** Attractor was previously on/off only, with a
hardcoded point count of 2 and randomized-but-fixed strength/radius ranges.
Added three sliders — Count (1–4), Strength (0.25x–2x), Falloff
(0.5x–2x radius) — shown only while Attractor is toggled on. Strength and
Falloff are applied as multipliers at render time via a new
`effectiveAttractors()` helper rather than mutating the seeded attractor
points directly, so:
- dragging a marker still starts from its true seeded position even after
  the sliders have been tuned away from 1x
- the seed/count persistence guarantee (attractors don't silently
  regenerate on every slider tweak) still holds
- `attractorData()`'s decorrelated RNG stream is untouched — Strength/
  Falloff never re-run it, they only scale its already-generated output

Count changes go through the same regeneration path as a seed change
(`attractorCountTrack` tracked alongside `attractorSeedTrack`), since a new
count genuinely needs a new call to `attractorData()`. Strength/Falloff
changes go through `refreshAfterAttractorDrag()` — the existing cheap
redraw path that reuses cached pattern data — since scaling doesn't need
to touch the seeded generators at all, matching the "don't re-run seeded
generators on every drag/slider tick" principle already established for
attractor-marker dragging.

## Current state
Three generation modes (Truchet, Blend, Waves), each with a 2D SVG render and
a matching 3D relief render (Three.js r128 via cdnjs), sharing one seeded
data-generation function per mode so both views always match. Whole-page
invert (`filter:invert(1)` on `<html>`) is the core interaction. 3D view adds
auto-orbit with manual click/touch-drag override, scroll-wheel/pinch zoom, a
bounding-sphere-based camera that auto-fits the model, density-proportional
relief height for Truchet/Waves, and an attractor system (1-4 seeded points,
user-tunable strength and falloff) where nearby shapes are pulled taller (or
shorter, for negative-strength attractors) via gaussian falloff. Attractor
points are draggable in the 2D view and the 3D relief updates live to match;
attractor position persists across refreshes and is only reset on a seed or
count change, not on every slider tweak. Footer credit/version is visible at
every viewport width.

## Invariants — do not touch without re-running the audit
- **Three.js CDN path must keep the `r` prefix**: `three.js/r128/three.min.js`,
  not `three.js/128/...`. cdnjs 404s silently on the wrong path — this was a
  real bug in v1.1.0 that produced a blank 3D view with no console-visible
  error until the fallback message was added.
- **`inkMat`/`paperMat` must set `metalness:0` explicitly.** Three.js
  r128's `MeshStandardMaterial` defaults metalness to 0.5 when unset,
  which gives a strong Fresnel-driven specular response even to a
  near-black albedo — this washed out the black/white contrast in the 3D
  view badly enough to be unreadable at any relief height (v1.6.1). Both
  materials are matte, fully non-metallic surfaces; if a future edit adds
  a new material for a new element type in the 3D scene, set
  `metalness:0` on it too unless there's a specific reason not to.
- **No `THREE.*` reference at top-level script scope.** Every `THREE` call
  must happen inside a function invoked after `ensure3D()`'s
  `typeof THREE === 'undefined'` guard. A top-level `new THREE.Vector3(...)`
  at script init will crash the *entire* script — including the 2D view —
  if the CDN ever fails to load. `orbitTarget` is intentionally a plain
  `{x,y,z}` object at declaration time, only replaced with a real
  `THREE.Vector3` inside `buildScene3D()`.
- **`refresh()` must render the SVG unconditionally**, even while `is3D` is
  true. Save SVG / Save PNG always export from the `<svg>` element, not the
  3D canvas — if a future edit gates the SVG render behind `if(!is3D)` to
  "optimize," export breaks silently while the 3D view still looks fine.
- **Container sizing is JS-driven (`applySquareSize()`), not CSS
  `aspect-ratio`.** An empty `<div>` (the 3D stage) doesn't reliably resolve
  `aspect-ratio` the way a content-bearing element does — this was the
  cause of the clipped/tiny 3D render in v1.1.1. Both `svg` and `stage3d`
  get explicit inline pixel `width`/`height` set from `.stage`'s measured
  available space, via `ResizeObserver` + `window.resize`.
- **Camera radius/target are computed from the model's bounding sphere**
  (`buildScene3D()`), not hardcoded. Zoom is a separate multiplier applied
  at render time (`effRadius = orbitRadius * zoomFactor` in `animate3()`);
  `buildScene3D()` remains the sole owner of the base radius calculation.
- **`isDragging` must suppress the auto-orbit increment**
  (`if(orbiting && !isDragging)`), or manual drag fights the animation loop.
- **`zoomFactor` must stay clamped to `MIN_ZOOM`/`MAX_ZOOM` (0.4–2.5).**
  Unclamped, scroll-wheel or a fast pinch can push the camera inside the
  model or far enough out that the model shrinks to an unusable speck —
  there's still no "reset zoom" affordance (see Open items).
- **Two-finger touch input must be routed to pinch-zoom, not orbit-drag.**
  `onTouchStart`/`onTouchMove` branch on `e.touches.length`: a second touch
  cancels any in-progress single-finger drag state before starting pinch
  tracking.
- **Truchet/Waves relief height is derived from local footprint size via
  `reliefScale(relief)`, not a flat constant.** Truchet multiplies by
  `c.s` (cell size); Waves multiplies by `data.bandH`. Blend intentionally
  still uses the flat global `H` — its layered-stack normalization against
  shape count doesn't need footprint scaling.
- **Base plate Z-position must stay negative** (`base.position.set(500,
  -baseThickness/2, -500)`). `mesh.rotation.x = -Math.PI/2`, applied to every
  extruded shape to lay it flat, maps local `(x,y,z)` to world `(x, z, -y)`,
  so extruded geometry lands in world Z range **-1000..0** and the
  never-rotated base plate must match it or it only touches at one edge.
- **`attractorData()` must use a decorrelated RNG stream**
  (`mulberry32(seed * 7919 + 13)`, not the same stream as the pattern
  generator), or toggling/tuning the attractor would silently change the
  underlying pattern for every seed.
- **`attractorMultiplier()` must stay clamped to a positive minimum**
  (`Math.max(0.15, m)`) to avoid zero/negative `ExtrudeGeometry` depth.
- **Attractor state must persist across `refresh()` calls, regenerated only
  on a seed or count change** (`attractorSeedTrack !== seed ||
  attractorCountTrack !== count`). Otherwise any manual repositioning or
  Strength/Falloff tuning would be silently overwritten on the next
  interaction/slider tick.
- **`effectiveAttractors()` scales strength/radius by the Strength/Falloff
  sliders without mutating the underlying `attractors` array.** The raw
  array (positions, seeded radius/strength) is what drag hit-testing and
  the seed/count persistence checks operate on; scaling happens only at
  render/build call sites (`renderAttractorMarkersSVG(effectiveAttractors())`,
  `buildScene3D(..., effectiveAttractors())`). If a future edit scales
  `attractors` in place instead, dragging after a Strength/Falloff tweak
  would start from an already-scaled radius/strength rather than the true
  seeded value, and repeated tweaks would compound.
- **Drag redraws and Strength/Falloff slider redraws must go through
  `refreshAfterAttractorDrag()`, not `refresh()`.** It reuses `lastData`
  (cached pattern geometry) instead of re-running the seeded data
  generators — wasted work on every pointermove/slider-input frame, and
  the whole reason this path exists in the first place.
- **`.footer-credit-mobile` must remain a DOM sibling of `.bar`, not a
  child of it.** `.bar` has `overflow-x:auto`; anything inside it can be
  scrolled out of view. The mobile footer's entire purpose is to be
  visible unconditionally, which only works outside the scrollable area.

## Known approximation (flagged, not a bug)
Blend mode's 3D relief is a **stepped-layer interpretation**, not a literal
3D equivalent of `mix-blend-mode: difference` — blend modes are a pure 2D
compositing concept with no direct 3D analog. Each shape is extruded at an
increasing base elevation by draw order, producing a sedimentary look.
Documented in code comments; revisit if it doesn't read well.

## Open items
- The metalness:0 fix in this version was diagnosed from the reported
  screenshots and period-accurate Three.js r128 docs, not from an actual
  re-render in this environment (no headless-browser/WebGL path available
  here — same limitation as the v1.5.0 relief tuning below). High
  confidence in the diagnosis, but worth a quick real-browser look to
  confirm ink shapes now read as properly black/dark at low relief and
  the overall contrast feels right, not overcorrected into flat/harsh.
- The v1.5.0 relief-scaling ratios were derived analytically from the
  generator math, not visually confirmed in a real browser — still worth
  an actual look, especially Waves at relief=10.
- No "reset zoom" control — scrolling/pinching to an extreme currently
  requires a page reload to recover. Worth a double-click/double-tap reset
  or a small reset button next to the orbit toggle.
- Mobile: touch-drag calls `preventDefault()` during single-finger orbit,
  which should reduce page-scroll conflicts, but hasn't had a real-device
  pass yet — needs verification on an actual phone.
- Attractor dragging only works in the 2D view; no direct drag-on-relief
  interaction in 3D (would need ray-casting against the base plane).
- No "reset attractor to seeded default" button — the only way back to the
  deterministic position/strength/falloff is clicking Generate (reseeds
  the whole pattern) or manually resetting the sliders to 100/100.
- Attractor Count/Strength/Falloff sliders have no numeric readout — just
  the raw slider, no value label. Worth adding if it's hard to tell what
  value you've landed on (Density/Relief have the same gap, for reference —
  not new to this version).

## Deployment
`netlify.toml` added: `publish = "."`, no build command (nothing to
compile — it's one static `index.html`), plus baseline security headers
and a no-cache rule on `index.html` so a fresh deploy is never served
stale from a CDN edge.

`audit_deploy.js` is safe to publish alongside everything else — it's a
static-analysis script that regex-checks `index.html` for structural
correctness (balanced braces, wiring, invariants). No credentials, tokens,
or sensitive data in it. Committing it keeps the "upload the three handoff
files, run the audit" convention intact for future sessions on this repo,
consistent with the other projects.

To push this to `JoeK212/figuregroundv1` and let Netlify's continuous
deployment pick it up from `main`, from the repo's local working copy:

```bash
cp index.html audit_deploy.js netlify.toml HANDOFF_v1.6.1.md /path/to/figuregroundv1/
cd /path/to/figuregroundv1
git add index.html audit_deploy.js netlify.toml HANDOFF_v1.6.1.md
git commit -m "v1.6.1: fix 3D metalness contrast bug; add netlify.toml"
git push origin main
```

Netlify will pick up the push automatically and deploy to
blackwhitefigurestudies.netlify.app. This step needs to happen from your
machine — pushing requires your GitHub credentials, which isn't something
I can do on your behalf.

## Changelog
v1.0.0 — Initial build: Truchet, Blend, Waves modes, whole-page invert, SVG/PNG export.
v1.1.0 — Added 3D relief view, auto-orbit, relief-height control.
v1.1.1 — Fixed Three.js CDN path bug; added load-failure fallback message.
v1.2.0 — Fixed container sizing (JS-driven, not CSS aspect-ratio) and camera
         framing (bounding-sphere auto-fit); added manual drag-to-orbit.
v1.2.1 — Fixed base plate floating disconnected from the pattern (Z-axis
         coordinate mismatch between rotated extruded shapes and the
         never-rotated base plate).
v1.3.0 — Added attractor points: seeded gaussian height modulation in 3D,
         faint influence-ring marker in 2D.
v1.3.1 — Attractor points are now draggable in the 2D view; attractor state
         made persistent across refreshes; drag redraws use cached pattern
         data instead of re-running the seeded generators.
v1.4.0 — Added zoom to the 3D view: scroll-wheel dolly on desktop,
         two-finger pinch on touch. Zoom is a clamped multiplier (0.4x-2.5x)
         applied to the bounding-sphere-derived orbitRadius at render time,
         so the camera-framing invariant still holds. Single-finger
         touch-drag now calls preventDefault() to reduce page-scroll
         conflicts on mobile.
v1.5.0 — Tuned relief slider behavior for Truchet and Waves: extrusion
         height is now proportional to each shape's own local footprint
         (cell size / stripe band height) via reliefScale(relief), instead
         of a flat global height shared across every density. Blend mode's
         stacked-layer height already normalized against shape count and
         needed no change.
v1.6.0 — Mobile footer credit/version no longer disappears below 720px:
         moved to a dedicated .footer-credit-mobile row outside the
         horizontally-scrolling control bar. Attractor is now tunable:
         Count (1-4), Strength (0.25x-2x), and Falloff (0.5x-2x radius)
         sliders, shown only while Attractor is on. Strength/Falloff apply
         via effectiveAttractors() at render time without mutating the
         seeded attractor points, preserving drag and persistence behavior.
v1.6.1 — Fixed washed-out black/white contrast in the 3D view: inkMat and
         paperMat now set metalness:0 explicitly, correcting for r128's
         MeshStandardMaterial defaulting metalness to 0.5 when unset,
         which gave the near-black ink material a metallic specular
         response strong enough to read as light gray under the overhead
         light — the actual cause of "hard to see black/white" reported
         via screenshots at low relief.
