# FIGURE / GROUND

Generative black & white ambiguity in the browser.

**Live:** [blackwhitefigurestudies.netlify.app](https://blackwhitefigurestudies.netlify.app)

## What it is

A seeded, deterministic pattern generator exploring figure-ground
perceptual ambiguity — the classic design/perception question of which
part of a composition reads as "figure" and which as "ground." Every
plate is reproducible from its seed.

Three generation modes, each with a matching 2D and 3D view:

- **Truchet** — quarter-disk tiles that flow into maze-like curves where
  it's genuinely hard to tell which channel is figure and which is ground.
- **Blend** — overlapping shapes composited with `mix-blend-mode: difference`,
  so regions emerge from overlap rather than being drawn directly.
- **Waves** — sinusoidal stripe bands that ripple against each other,
  Op-art moiré style.

## Invert

The core interaction: **Invert** flips the entire page — canvas and
interface both — via `filter:invert(1)`, not just the artwork. Which of
black/white reads as "figure" reverses in one move.

## 3D relief view

Switch to **3D** to see the current pattern extruded into a physical
relief sculpture — black regions become raised geometry on a paper-colored
base plate. Auto-orbiting camera, with manual click/touch-drag override
and scroll-wheel/pinch zoom.

## Attractor

Toggle **Attractor** to add 1–4 seeded points that pull nearby shapes
taller (or shorter, for negative-strength points) via gaussian falloff —
an easy way to coax more sculptural, less uniform compositions out of the
3D relief. Points are draggable directly in the 2D view; **Count**,
**Strength**, and **Falloff** sliders tune the effect once it's on.

## Controls

- **Seed** — set directly, or click Generate for a random one
- **Density** — controls shape/cell/stripe count
- **Relief** — extrusion height in the 3D view
- **Save SVG / Save PNG** — export the current plate

## Tech

Single-file HTML/CSS/JS, no build step. Deterministic output via a seeded
PRNG (mulberry32), decorrelated per-feature so toggles never perturb the
underlying pattern. 3D rendered with Three.js (r128, via cdnjs).

## Development

See `HANDOFF_v1.6.1.md` for the full engineering history, invariants
(things that will silently break if touched carelessly), and open items.
`audit_deploy.js` is a static QA pass over `index.html` — run it with
`node audit_deploy.js` before pushing changes.

---
Joe.K · [axisbim.io](https://axisbim.io)
