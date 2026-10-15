/*
 * Regenerates src/data/states.json from U.S. Census Bureau boundaries (via the us-atlas package).
 *
 * For each of the 48 contiguous states it writes:
 *   outline   - polygon(s) for drawing, lightly simplified
 *   convex    - the same shape, simplified more and split into convex pieces (Matter.js bodies must be convex)
 *   neighbors - states that share a border, from TopoJSON arcs
 * Coordinates are Albers-projected and shifted so the map starts at (0, 0).
 *
 * Run with `npm run build:map`. Output is deterministic for the pinned package versions.
 */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const topo = require('us-atlas/states-albers-10m.json');
const tc = require('topojson-client');
const decomp = require('poly-decomp');
const simplify = require('simplify-js');

// FIPS code -> postal abbreviation, Lower 48 only
// prettier-ignore
const ABBR = { '01':'AL','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','12':'FL','13':'GA','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY' };

const geoms = topo.objects.states.geometries;
const keepIdx = geoms.map((g, i) => (ABBR[g.id] ? i : -1)).filter(i => i >= 0);
const nb = tc.neighbors(geoms);
const feats = tc.feature(topo, topo.objects.states).features;
const area = r => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i],
      q = r[(i + 1) % r.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};

let minx = 1e9,
  miny = 1e9,
  maxx = -1e9,
  maxy = -1e9;
const out = [];
for (const i of keepIdx) {
  const f = feats[i],
    ab = ABBR[f.id];
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = polys
    .map(p => p[0])
    .map(r => ({ r, a: Math.abs(area(r)) }))
    .sort((x, y) => y.a - x.a);
  const big = rings[0].a;
  const parts = [];
  for (const { r, a } of rings) {
    if (a < Math.max(big * 0.12, 40)) continue; // drop small islands
    const simp = tol => {
      const pts = simplify(
        r.slice(0, -1).map(([x, y]) => ({ x, y })),
        tol,
        true,
      ).map(p => [+p.x.toFixed(1), +p.y.toFixed(1)]);
      decomp.makeCCW(pts);
      decomp.removeCollinearPoints(pts, 0.02);
      decomp.removeDuplicatePoints(pts, 0.5);
      return pts;
    };
    const pts = simp(1.2); // drawing outline
    let convex = null; // physics: try tolerances until the shape decomposes cleanly
    for (const t of [3, 2.6, 3.4, 2.2, 4, 1.8, 1.6, 1.4, 5, 6, 1.2, 1]) {
      const p = simp(t);
      if (decomp.isSimple(p)) {
        const c = decomp.quickDecomp(p);
        if (c && c.length) {
          convex = c;
          break;
        }
      }
    }
    if (!convex) {
      console.error('Could not decompose', ab);
      process.exitCode = 1;
      continue;
    }
    convex = convex
      .filter(c => c.length >= 3 && Math.abs(area(c)) > 2)
      .map(c => c.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]));
    for (const [x, y] of pts) {
      minx = Math.min(minx, x);
      maxx = Math.max(maxx, x);
      miny = Math.min(miny, y);
      maxy = Math.max(maxy, y);
    }
    parts.push({ outline: pts, convex });
  }
  const neighbors = nb[i].map(j => ABBR[geoms[j].id]).filter(Boolean);
  out.push({ id: ab, name: f.properties.name, parts, neighbors });
}
const shift = ([x, y]) => [+(x - minx).toFixed(1), +(y - miny).toFixed(1)];
for (const s of out)
  for (const p of s.parts) {
    p.outline = p.outline.map(shift);
    p.convex = p.convex.map(c => c.map(shift));
  }

const file = new URL('../src/data/states.json', import.meta.url);
writeFileSync(file, JSON.stringify({ w: +(maxx - minx).toFixed(1), h: +(maxy - miny).toFixed(1), states: out }));
console.log(`Wrote ${out.length} states to src/data/states.json`);
