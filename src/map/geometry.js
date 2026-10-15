import Matter from 'matter-js';
import DATA from '../data/states.json';
import { CFG, TEST_IDS } from '../config.js';

const { Vertices } = Matter;

const S = (CFG.mapFill * CFG.boxW) / DATA.w;
export const STATES = {};
for (const s of DATA.states) {
  const parts = s.parts.map(p => ({
    outline: p.outline.map(([x, y]) => ({ x: x * S, y: y * S })),
    convex: p.convex.map(c => c.map(([x, y]) => ({ x: x * S, y: y * S }))),
  }));
  const all = parts.flatMap(p => p.outline);
  const bb = {
    minX: Math.min(...all.map(p => p.x)),
    maxX: Math.max(...all.map(p => p.x)),
    minY: Math.min(...all.map(p => p.y)),
    maxY: Math.max(...all.map(p => p.y)),
  };
  const main = parts.reduce((a, b) =>
    Math.abs(Vertices.area(b.outline)) > Math.abs(Vertices.area(a.outline)) ? b : a,
  );
  STATES[s.id] = {
    id: s.id,
    name: s.name,
    parts,
    bb,
    labelAt: Vertices.centre(main.outline),
    area: parts.reduce((t, p) => t + Math.abs(Vertices.area(p.outline)), 0),
    neighbors: new Set(s.neighbors),
  };
}
/* Collision chunks: each state's convex pieces, in map space. */
for (const s of Object.values(STATES))
  s.chunks = s.parts.flatMap(part =>
    part.convex.map(v => ({ state: s.id, verts: v, area: Math.abs(Vertices.area(v)) })),
  );
export const IDS = Object.keys(STATES);
/* States that must all be connected to complete a round */
export const GOAL_IDS = TEST_IDS ?? IDS;
// Color buckets by cultural region (index = CSS var --cN)
// prettier-ignore
const COLOR_GROUPS = [
  ['WA','OR','ID'],                                             // c0 Pacific Northwest (blue)
  ['MT','WY','CO'],                                             // c1 Rockies (green)
  ['CA','NV','UT','AZ','NM','TX'],                              // c2 Southwest (purple)
  ['ND','SD','NE','KS','OK','MN','IA','MO'],                    // c3 Plains (tan)
  ['WI','MI','IL','IN','OH'],                                   // c4 Midwest (orange)
  ['KY','TN','AR','LA','MS','AL','GA','FL','SC','NC','VA','WV'],// c5 South (gray)
  ['PA','NY','NJ','DE','MD','CT','RI','MA','VT','NH','ME']      // c6 Northeast (pink)
];
COLOR_GROUPS.forEach((ids, c) =>
  ids.forEach(id => {
    STATES[id].color = c;
  }),
);
/* Pieces: what actually drops. Most are one state; tiny neighbors ship pre-joined. */
// prettier-ignore
const CLUSTERS = [
  { name:'VT, NH, MA, CT, RI', states:['VT','NH','MA','CT','RI'] },
  { name:'Maryland and Delaware', states:['MD','DE'] }
];
export const PIECES = [];
{
  const clustered = new Set(CLUSTERS.flatMap(c => c.states));
  for (const c of CLUSTERS) PIECES.push({ name: c.name, states: c.states });
  for (const id of IDS) if (!clustered.has(id)) PIECES.push({ name: STATES[id].name, states: [id] });
  for (const p of PIECES) {
    const bbs = p.states.map(i => STATES[i].bb);
    p.bb = {
      minX: Math.min(...bbs.map(b => b.minX)),
      maxX: Math.max(...bbs.map(b => b.maxX)),
      minY: Math.min(...bbs.map(b => b.minY)),
      maxY: Math.max(...bbs.map(b => b.maxY)),
    };
  }
}
/* A pre-joined piece acts like one big state: any of its states sticks to anything that borders any state in the piece. */
{
  const UNIT = {};
  for (const p of PIECES) for (const id of p.states) UNIT[id] = p.states;
  for (const id of IDS)
    STATES[id].stickTo = new Set(
      IDS.filter(t => !UNIT[id].includes(t) && UNIT[id].some(x => UNIT[t].some(y => STATES[x].neighbors.has(y)))),
    );
}
/* A droppable piece: any set of states laid out as on the map, rotated about the centre of its bounding box. */
export function makePiece(states, name) {
  const pts = states.flatMap(id => STATES[id].parts.flatMap(p => p.outline));
  const bb = {
    minX: Math.min(...pts.map(p => p.x)),
    maxX: Math.max(...pts.map(p => p.x)),
    minY: Math.min(...pts.map(p => p.y)),
    maxY: Math.max(...pts.map(p => p.y)),
  };
  // Spin about the piece's true centre (area-weighted), and note how far its outline reaches from it
  let A = 0,
    sx = 0,
    sy = 0;
  for (const id of states)
    for (const p of STATES[id].parts) {
      const a = Math.abs(Vertices.area(p.outline)),
        m = Vertices.centre(p.outline);
      A += a;
      sx += m.x * a;
      sy += m.y * a;
    }
  const c = { x: sx / A, y: sy / A },
    R = Math.max(...pts.map(p => Math.hypot(p.x - c.x, p.y - c.y)));
  return { name, states, bb, pts, c, R };
}
for (const p of PIECES) Object.assign(p, makePiece(p.states, p.name));
/* The pieces dealt each round */
export const DECK = TEST_IDS ? PIECES.filter(p => p.states.every(id => TEST_IDS.includes(id))) : PIECES;
/* Extent of a piece rotated by ang, relative to its centre */
export function extent(pc, ang) {
  const cs = Math.cos(ang),
    sn = Math.sin(ang);
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const p of pc.pts) {
    const dx = p.x - pc.c.x,
      dy = p.y - pc.c.y,
      rx = cs * dx - sn * dy,
      ry = sn * dx + cs * dy;
    if (rx < x0) x0 = rx;
    if (rx > x1) x1 = rx;
    if (ry < y0) y0 = ry;
    if (ry > y1) y1 = ry;
  }
  return { x0, x1, y0, y1 };
}
