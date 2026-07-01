/**
 * FIGURE / GROUND — audit_deploy.js
 * Static-analysis QA pass over index.html. Run with: node audit_deploy.js
 * Mirrors the audit_deploy.js convention used on Modulor Massing.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'index.html');
const html = fs.readFileSync(FILE, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const js = scriptMatch ? scriptMatch[1] : '';

let pass = 0, fail = 0;
const failures = [];

function check(label, condition){
  if(condition){
    pass++;
  } else {
    fail++;
    failures.push(label);
  }
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
}

console.log('=== FIGURE / GROUND — audit_deploy.js ===\n');

// --- 1. Structural HTML ---
check('DOCTYPE present', /<!DOCTYPE html>/i.test(html));
check('html/head/body tags present', /<html[\s>]/.test(html) && /<head>/.test(html) && /<body>/.test(html));
check('Exactly one <script src=...> (Three.js CDN)', (html.match(/<script src=/g) || []).length === 1);
check('Exactly one inline <script> block', (html.match(/<script>/g) || []).length === 1);

// --- 2. Three.js CDN correctness ---
check('Three.js CDN URL uses "r128" (not "128")', /three\.js\/r128\/three\.min\.js/.test(html));
check('THREE.Vector3 not referenced at top-level script init (would crash if lib fails to load)',
  !/^\s*let orbitTarget\s*=\s*new THREE/m.test(js));

// --- 3. Brace / paren balance ---
(function(){
  let depth = 0, paren = 0, brack = 0;
  for(const ch of js){
    if(ch==='{') depth++; if(ch==='}') depth--;
    if(ch==='(') paren++; if(ch===')') paren--;
    if(ch==='[') brack++; if(ch===']') brack--;
  }
  check('Braces balanced', depth === 0);
  check('Parens balanced', paren === 0);
  check('Brackets balanced', brack === 0);
})();

// --- 4. getElementById / querySelector targets exist ---
(function(){
  const ids = [...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
  const uniqueIds = [...new Set(ids)];
  let allFound = true;
  uniqueIds.forEach(id => {
    const re = new RegExp(`id=["']${id}["']`);
    if(!re.test(html)){
      allFound = false;
      failures.push(`Missing element for getElementById('${id}')`);
    }
  });
  check(`All ${uniqueIds.length} getElementById() targets exist in HTML`, allFound);
})();

// --- 5. No duplicate IDs in HTML ---
(function(){
  const idAttrs = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
  const seen = new Set();
  let dupe = null;
  for(const id of idAttrs){
    if(seen.has(id)){ dupe = id; break; }
    seen.add(id);
  }
  check('No duplicate element IDs', dupe === null);
})();

// --- 6. Removed / stale function references ---
check('No dangling reference to removed resize3D()', !/\bresize3D\s*\(/.test(js));
check('applySquareSize() is defined', /function applySquareSize\(/.test(js));
check('applySquareSize() is called on init', /applySquareSize\(\);\s*\n\s*refresh\(\);\s*\n\s*\}\)\(\);/.test(js) || /applySquareSize\(\);[\s\S]*refresh\(\);[\s\S]*\}\)\(\);/.test(js));

// --- 7. Core function definitions present exactly once ---
const REQUIRED_FUNCTIONS = [
  'mulberry32','el','clearSvg','truchetData','blendData','wavesData',
  'renderTruchetSVG','renderBlendSVG','renderWavesSVG','currentData',
  'quarterShape','rectShape','extrudeMesh','ensure3D','buildScene3D',
  'applySquareSize','animate3','setupDragControls','refresh','setMode'
];
REQUIRED_FUNCTIONS.forEach(fn => {
  const re = new RegExp(`function ${fn}\\(`, 'g');
  const count = (js.match(re) || []).length;
  check(`function ${fn}() defined exactly once`, count === 1);
});

// --- 8. Data/render parity — every mode has both a data fn and a 2D renderer ---
['truchet','blend','waves'].forEach(mode => {
  const dataFn = mode + 'Data';
  const renderFn = 'render' + mode[0].toUpperCase() + mode.slice(1) + 'SVG';
  check(`${mode}: ${dataFn}() and ${renderFn}() both present`,
    js.includes(`function ${dataFn}(`) && js.includes(`function ${renderFn}(`));
});

// --- 9. refresh() always renders SVG regardless of view mode (export invariant) ---
check('refresh() renders 2D SVG unconditionally (SVG/PNG export must work from 3D view too)',
  /renderTruchetSVG\(data\)/.test(js) && !/if\s*\(\s*!is3D\s*\)[\s\S]{0,40}renderTruchetSVG/.test(js));

// --- 10. Controls wired to refresh/behavior ---
check('seedInput wired to refresh', /seedInput\.addEventListener\(['"]input['"],\s*refresh\)/.test(js));
check('densitySlider wired to refresh', /densitySlider\.addEventListener\(['"]input['"],\s*refresh\)/.test(js));
check('reliefSlider wired to refresh', /reliefSlider\.addEventListener\(['"]input['"],\s*refresh\)/.test(js));
check('view3dBtn click handler present', /view3dBtn['"]\)\.addEventListener\(['"]click['"]/.test(js));
check('orbitToggle click handler present', /orbitToggle['"]\)\.addEventListener\(['"]click['"]/.test(js));
check('invertBtn click handler present', /invertBtn['"]\)\.addEventListener\(['"]click['"]/.test(js));

// --- 11. Drag controls guard against auto-orbit fighting manual drag ---
check('animate3() suppresses auto-increment while isDragging', /if\s*\(\s*orbiting\s*&&\s*!isDragging\s*\)/.test(js));

// --- 12. Camera framing uses computed bounding sphere, not a magic constant ---
check('Camera radius derived from bounding sphere (not hardcoded)', /getBoundingSphere/.test(js) && /orbitRadius\s*=\s*\(sphere\.radius/.test(js));

// --- 13. ResizeObserver guarded for environments without it ---
check('ResizeObserver usage is feature-detected', /typeof ResizeObserver\s*!==\s*['"]undefined['"]/.test(js));

// --- 14. Version consistency ---
(function(){
  const versionConst = js.match(/const APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
  const changelogVersions = [...html.matchAll(/v(\d+\.\d+\.\d+)\s+—/g)].map(m => 'v'+m[1]);
  const latest = changelogVersions[changelogVersions.length - 1];
  check('APP_VERSION matches latest changelog entry',
    versionConst && latest && versionConst[1] === latest,
    );
  if(versionConst) console.log(`   APP_VERSION = ${versionConst[1]}, latest changelog = ${latest}`);
})();

// --- 15. Fallback message if THREE fails to load ---
check('Visible fallback message if THREE fails to load', /3D library failed to load/.test(js));
check('buildScene3D() guards against missing renderer3', /function buildScene3D[\s\S]{0,120}if\s*\(!renderer3\)\s*return;/.test(js));

// --- 16. Base plate must share the extruded shapes' world-Z range ---
// mesh.rotation.x = -Math.PI/2 maps local (x,y,z) -> world (x, z, -y), so a
// shape's local y (0..1000) lands in world Z range -1000..0. The base plate
// (never rotated) must be positioned in that same negative Z range or it
// only touches the pattern at one edge instead of sitting underneath it.
check('Base plate Z-position matches extruded shapes\' world-Z range (negative)',
  /base\.position\.set\(500,\s*-baseThickness\/2,\s*-500\)/.test(js));

// --- 17. Attractor feature: decorrelated RNG + wiring ---
check('attractorData() uses a decorrelated RNG stream (does not consume the main pattern RNG)',
  /function attractorData\(seed, count\)\{[\s\S]{0,80}mulberry32\(seed \* \d+ \+ \d+\)/.test(js));
check('attractorMultiplier() clamps to a positive minimum (no negative/zero extrude depth)',
  /return Math\.max\(0\.15,\s*m\)/.test(js));
check('buildScene3D() accepts an attractors parameter', /function buildScene3D\(mode, data, relief, attractors\)/.test(js));
check('attractorToggle wired to refresh()', /attractorToggle['"]\)\.addEventListener\(['"]click['"][\s\S]{0,250}refresh\(\)/.test(js));
check('refresh() skips attractor generation entirely when attractorOn is false (avoids wasted work)',
  /\}\s*else\s*\{\s*attractors = \[\];\s*\}/.test(js));

// --- 18. Attractor drag-editing: persistence + lightweight redraw ---
check('Attractor state is persistent (not regenerated every refresh call unless seed or count changed)',
  /attractorSeedTrack !== seed \|\| attractorCountTrack !== count \|\| attractors\.length === 0/.test(js));
check('refreshAfterAttractorDrag() reuses cached lastData (does not re-run seeded generators)',
  /function refreshAfterAttractorDrag\(\)\{[\s\S]{0,200}renderTruchetSVG\(lastData\)/.test(js));
check('Drag handlers use JS distance-based hit testing (45-unit threshold), not DOM hit targets',
  /closestDist < 45/.test(js));
check('clientToSvgPoint() correctly maps screen coords via getScreenCTM().inverse()',
  /getScreenCTM\(\)/.test(js) && /matrixTransform\(ctm\.inverse\(\)\)/.test(js));
check('Attractor drag position is clamped to canvas bounds (0..1000)',
  /Math\.max\(0, Math\.min\(1000, p\.x\)\)/.test(js) && /Math\.max\(0, Math\.min\(1000, p\.y\)\)/.test(js));

// --- 19. Zoom / dolly: multiplier on top of bounding-sphere radius, not a replacement ---
check('zoomFactor is clamped between MIN_ZOOM and MAX_ZOOM constants',
  /const MIN_ZOOM\s*=\s*0\.4,\s*MAX_ZOOM\s*=\s*2\.5/.test(js));
check('animate3() applies zoomFactor as a multiplier on orbitRadius (camera radius invariant preserved)',
  /const effRadius = orbitRadius \* zoomFactor;/.test(js) && /camera3\.position\.x = orbitTarget\.x \+ effRadius/.test(js));
check('wheel handler wired on stage3d with preventDefault (blocks page scroll-zoom)',
  /stage3d\.addEventListener\(['"]wheel['"],\s*onWheel,\s*\{passive:false\}\)/.test(js) &&
  /const onWheel = \(e\) => \{\s*e\.preventDefault\(\);/.test(js));
check('two-finger pinch adjusts zoomFactor via touch distance ratio',
  /pinchStartZoom \* \(pinchStartDist \/ d\)/.test(js));
check('single-finger touchmove calls preventDefault (avoids fighting page scroll during orbit drag)',
  /else if\(e\.touches\.length === 1\)\{\s*e\.preventDefault\(\);\s*onMove\(e\);/.test(js));
check('zoomFactor never mutates orbitRadius itself (buildScene3D remains sole owner of base framing)',
  !/orbitRadius\s*\*=\s*zoomFactor/.test(js) && !/orbitRadius\s*=\s*orbitRadius\s*\*\s*zoomFactor/.test(js));

// --- 20. Relief scaling: Truchet/Waves height ties to local footprint, not a flat constant ---
check('reliefScale() helper is defined',
  /function reliefScale\(relief\)\{/.test(js));
check('wavesData() returns bandH (needed for footprint-relative extrusion height)',
  /return \{ stripes, bandH \};/.test(js));
check('Truchet extrusion height scales with cell size c.s, not the flat global H',
  /const shapeH = c\.s \* reliefScale\(relief\) \* attractorMultiplier\(cellCx, cellCy, attr\);/.test(js));
check('Waves extrusion height scales with data.bandH, not the flat global H',
  /const shapeH = bandH \* reliefScale\(relief\) \* attractorMultiplier\(mid\[0\], mid\[1\], attr\);/.test(js));
check('Blend mode still uses the flat global H (its stacked-layer height already normalizes against shape count)',
  /const layerH = H \/ Math\.max\(1,data\.shapes\.length\) \* 3\.2;/.test(js));

// --- 21. Mobile footer credit stays visible (not hidden entirely below 720px) ---
check('Dedicated .footer-credit-mobile element exists in HTML',
  /class="footer-credit-mobile"/.test(html));
check('.footer-credit-mobile is a sibling of .bar (not inside the scrollable bar), so it is never scrolled out of view',
  /<\/div>\s*<div class="footer-credit-mobile">/.test(html));
check('.footer-credit-mobile becomes visible at the 720px breakpoint (desktop .footer-credit hides, mobile one shows)',
  /\.footer-credit\{display:none;\}\s*\.footer-credit-mobile\{display:flex;\}/.test(html));
check('appVersionMobile span is populated alongside appVersion',
  /getElementById\('appVersionMobile'\)\.textContent = APP_VERSION;/.test(js));

// --- 22. Attractor count/strength/falloff are user-tunable ---
check('attractorCountSlider drives attractorData() point count instead of a hardcoded 2',
  /const count = parseInt\(attractorCountSlider\.value\);/.test(js) && /attractors = attractorData\(seed, count\);/.test(js));
check('attractorCountTrack triggers regeneration on count change (mirrors seed-change tracking)',
  /attractorCountTrack !== count/.test(js));
check('effectiveAttractors() scales strength/radius from slider values without mutating the seeded attractors array',
  /function effectiveAttractors\(\)\{[\s\S]{0,300}strength:a\.strength\*sMult, radius:a\.radius\*fMult/.test(js));
check('refresh() and refreshAfterAttractorDrag() render/build using effectiveAttractors(), not raw attractors, so Strength/Falloff take effect',
  (js.match(/effectiveAttractors\(\)/g) || []).length >= 4);
check('Strength/Falloff sliders are wired to the cheap redraw path (refreshAfterAttractorDrag), not full refresh() — avoids re-running seeded generators on every drag tick',
  /attractorStrengthSlider\.addEventListener\('input', refreshAfterAttractorDrag\)/.test(js) &&
  /attractorFalloffSlider\.addEventListener\('input', refreshAfterAttractorDrag\)/.test(js));
check('Count slider is wired to full refresh() (a new count needs new attractorData(), unlike strength/falloff)',
  /attractorCountSlider\.addEventListener\('input', refresh\)/.test(js));
check('Attractor tuning controls group is hidden until Attractor is toggled on',
  /attractorControlsGroup\.classList\.toggle\('active', attractorOn\)/.test(js));

// --- 23. 3D material contrast: metalness must be explicit, not left at the r128 default ---
check('inkMat is explicitly non-metallic (metalness:0) — r128 defaults to 0.5, which washes out black/white contrast under lighting',
  /const inkMat = new THREE\.MeshStandardMaterial\(\{color:0x0A0A0A, roughness:0\.65, metalness:0\}\);/.test(js));
check('paperMat is explicitly non-metallic (metalness:0) for the same reason',
  /const paperMat = new THREE\.MeshStandardMaterial\(\{color:0xFAFAF9, roughness:0\.85, metalness:0\}\);/.test(js));

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
if(fail > 0){
  console.log('\nFailures:');
  failures.forEach(f => console.log(' - ' + f));
  process.exitCode = 1;
}
