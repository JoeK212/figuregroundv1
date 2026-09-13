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
- **Auto-generate** — on by default from page load, cycling to a new
  random pattern every 2s (adjustable: 2/5/10/15/30s). Toggle off with
  the Auto button to explore a pattern manually.
- **3D relief view** — auto-orbiting camera, drag to rotate, scroll-wheel
  or pinch to zoom, plus a Plan button for a true top-down orthographic
  view (with an on-screen "PLAN" badge, and orbit/drag disabled since
  they're no-ops in that mode). Reset Zoom button to snap back to the
  auto-fit framing.
- **Attractors** — seeded points that pull nearby shapes taller or shorter
  in the 3D view, with tunable count, strength, and falloff. Draggable
  directly on the 2D canvas. Reset Attractors button to return to the
  seeded defaults.
- Export as SVG or PNG.
` (a pre-deploy validation script) and
a per-version `HANDOFF_vX.X.X.md` changelog. A new session starts by
re-running the audit against the current `index.html` to confirm the---

---
Joe.K · [axisbim.io](https://axisbim.io)
