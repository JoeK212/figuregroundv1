# FIGURE / GROUND

A generative black & white ambiguity tool. Single-file HTML/JS, no build step.

**Live:** [blackwhitefigurestudies.netlify.app](https://blackwhitefigurestudies.netlify.app)
**Repo:** `JoeK212/figuregroundv1`
**Deploy:** Netlify continuous deployment from `main`

---

## What it does

FIGURE / GROUND generates black-and-white geometric compositions built around
a single interaction: a whole-page invert (`filter:invert(1)`) that flips
which shapes read as figure and which read as ground. Three generation
modes — **Truchet**, **Blend**, and **Waves** — each pair a seeded 2D SVG
render with a matching 3D relief render (Three.js), sharing one data-generation
function per mode so both views always stay in sync.

The 3D view adds auto-orbit with manual click/touch-drag override, a
bounding-sphere-based camera that auto-fits the model, and an optional
**attractor** toggle: 1–2 seeded points pull nearby shapes taller (or
shorter, for negative-strength attractors) via gaussian falloff. Attractor
points are draggable directly in the 2D view, and the 3D relief updates live
to match — position persists across refreshes and only resets on a seed
change.

### Modes

| Mode | Description |
|---|---|
| **Truchet** | Truchet-tile style interlocking pattern |
| **Blend** | Overlapping shapes with a stepped-layer 3D interpretation of 2D blend compositing |
| **Waves** | Wave-derived geometric composition |

Compositions are seed-based — every result is unique but reproducible.

---

## Project structure

```
figuregroundv1/
├── index.html      Single-file app — HTML, CSS, JS, Three.js scene, all in one
└── README.md       This file
```

There is no build step. `index.html` is deployed as-is.

## Development workflow

Active development happens in versioned sessions. Each session produces the
current `index.html` plus two working files that support the process but
aren't part of this repo: `audit_deploy.js` (a static-analysis QA pass — run
with `node audit_deploy.js`) and a per-version `HANDOFF_vX.X.X.md` changelog.
A new session starts by re-running the audit against the current `index.html`
to confirm the starting state is clean before making changes.

## Critical invariants — do not modify

These are load-bearing and have broken silently in the past when touched
incidentally:

- Three.js CDN path must keep the `r` prefix (`three.js/r128/three.min.js`)
- No `THREE.*` reference at top-level script scope — `orbitTarget` stays a
  plain object until replaced inside `buildScene3D()`
- `refresh()` must render the SVG unconditionally, even in 3D view (export
  depends on it)
- Container sizing is JS-driven (`applySquareSize()`), not CSS `aspect-ratio`
- Camera radius/target are computed from the model's bounding sphere, never
  hardcoded
- `isDragging` must suppress the auto-orbit increment
- Base plate Z-position must stay in the negative range matching the
  extruded shapes' world-Z mapping
- `attractorData()` must use a decorrelated RNG stream, separate from the
  main pattern generator
- `attractorMultiplier()` must stay clamped to a positive minimum
- Attractor state persists across `refresh()` calls, regenerated only on a
  seed change
- Drag redraws go through `refreshAfterAttractorDrag()` (cached data), not
  `refresh()`

## Known open issues

- No zoom control in 3D (drag only rotates, no scroll-wheel dolly)
- Relief slider range not yet tuned against all three modes at extremes
- Mobile: footer credit hidden under 720px; touch drag vs. page scroll not
  fully tested
- Attractor is on/off only — count, strength range, and falloff radius
  aren't user-tunable yet
- Attractor dragging only works in the 2D view, not directly on the 3D relief
- No "reset attractor to seeded default" button short of reseeding the whole
  pattern

---

## Local development

No build tooling required — open `index.html` directly in a browser, or
serve it with any static file server.

## Deployment

Push to `main` on `JoeK212/figuregroundv1` — Netlify continuous deployment
builds and publishes automatically to `blackwhitefigurestudies.netlify.app`.

---

*Joe K. · [axisbim.io](https://axisbim.io)*
