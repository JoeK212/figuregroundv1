# FIGURE / GROUND

**Which is which?** A generative black & white ambiguity tool — three
pattern modes, a whole-page invert as the core interaction, and a matching
3D relief view.

**Live:** [blackwhitefigurestudies.netlify.app](https://blackwhitefigurestudies.netlify.app)
**Repo:** `JoeK212/figuregroundv1`
**Deploy:** Netlify continuous deployment from `main`

Requires a tablet or desktop display — below 700px on either dimension
the app is replaced by a message asking for a larger screen, since the
control bar and 3D drag/pinch interactions aren't workable at phone size.

---

## What it does

- **Truchet, Blend, and Waves** — three seeded generative pattern modes,
  each rendered as flat black & white 2D and as an extruded 3D relief
  from the same underlying data, so both views always match.
- **Invert** flips the whole page (`filter:invert(1)`) — the piece's core
  interaction: is the black the figure, or is the white?
- **3D relief view** — auto-orbiting camera, drag to rotate, scroll-wheel
  or pinch to zoom, plus a Plan button for a true top-down orthographic
  view of the relief.
- **Attractors** — seeded points that pull nearby shapes taller or shorter
  in the 3D view, with tunable count, strength, and falloff. Draggable
  directly on the 2D canvas.
- Export as SVG or PNG.

## Project structure

```
figuregroundv1/
├── index.html      Single-file app — HTML, CSS, JS, Three.js scene, all in one
├── netlify.toml    Build/publish config
└── README.md       This file
```

There is no build step. `index.html` is deployed as-is.

## Development workflow

Active development happens in versioned sessions, each producing
`index.html` plus two working files that support the process but aren't
part of this repo: `audit_deploy.js` (a 100-check pre-deploy validation
script) and a per-version `HANDOFF_vX.X.X.md` changelog. A new session
starts by re-running the audit against the current `index.html` to confirm
the starting state is clean before making changes.

## Critical invariants — do not modify without re-running the audit

- The small-screen gate triggers on `(max-width:700px), (max-height:700px)`
  — a comma (OR), not `and`, so landscape phones don't slip through
- Three.js CDN path keeps the `r` prefix (`three.js/r128/...`)
- No `THREE.*` reference at top-level script scope
- `refresh()` renders the SVG unconditionally, even in 3D view
- Container sizing is JS-driven (`applySquareSize()`), not CSS `aspect-ratio`
- Camera radius/target computed from bounding sphere, never hardcoded
- `isDragging` and Plan view both suppress the auto-orbit increment
- `inkMat`/`paperMat` set `metalness:0` explicitly
- The control bar wraps (`flex-wrap`) rather than hiding content behind
  horizontal scroll
- Plan view's orthographic frustum is derived from the same bounding
  sphere as the perspective camera's radius
- Base plate Z-position stays negative
- `attractorData()` uses a decorrelated RNG stream
- Attractor state persists across `refresh()`, only resets on seed/count change

## Known open issues

- The 700px gate threshold isn't verified against every real device
- No "reset zoom" control in the 3D view
- Attractor dragging only works in the 2D view, not directly on the 3D relief
- No "reset attractor to seeded default" button
- Plan view has no on-screen label besides the button's active state

## Tech

HTML / vanilla JS / SVG / [Three.js](https://threejs.org) (r128).

---

*Joe K. · [axisbim.io](https://axisbim.io)*
