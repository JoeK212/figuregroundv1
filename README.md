# FIGURE / GROUND

**Which is which?** A generative black & white ambiguity tool — three
pattern modes, a whole-page invert as the core interaction, and a matching
3D relief view.

**Live:** [blackwhitefigurestudies.netlify.app](https://blackwhitefigurestudies.netlify.app)

## What it does

- **Truchet, Blend, and Waves** — three seeded generative pattern modes,
  each rendered as flat black & white 2D and as an extruded 3D relief
  from the same underlying data, so both views always match.
- **Invert** flips the whole page (`filter:invert(1)`) — the piece's core
  interaction: is the black the figure, or is the white?
- **3D relief view** — auto-orbiting camera, drag to rotate, scroll-wheel
  or pinch to zoom.
- **Attractors** — seeded points that pull nearby shapes taller or shorter
  in the 3D view, with tunable count, strength, and falloff. Draggable
  directly on the 2D canvas.
- Export as SVG or PNG.

Built single-file, no build step — one `index.html`, Three.js loaded from
a CDN.

## Tech

HTML / vanilla JS / SVG / [Three.js](https://threejs.org) (r128). Deployed
via Netlify continuous deployment from `main`.

---

Joe.K · [axisbim.io](https://axisbim.io)

Full build history, invariants, and technical notes: see
`HANDOFF_v1.7.2.md` (local dev file, not tracked in this repo).
