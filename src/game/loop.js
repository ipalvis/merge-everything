import Matter from 'matter-js';
import { CFG } from '../config.js';
import { clampAim } from './aim.js';
import { updateBlend } from './blend.js';
import { dangerY, gameOver } from './game.js';
import { processMerges } from '../physics/world.js';
import { render } from '../render/render.js';
import { G } from '../state.js';

const { Body, Engine, Sleeping } = Matter;

let acc = 0;
const STEP = 1000 / 60;
function checkOverflow(now) {
  const dy = dangerY();
  const over = G.groups.some(g => now - g.born > CFG.overflowGrace && g.bounds.min.y < dy && Body.getSpeed(g) < 1.2);
  if (!over) {
    G.dangerSince = null;
    return;
  }
  if (G.dangerSince === null) G.dangerSince = now;
  if (now - G.dangerSince > CFG.overflowLimit) gameOver();
}
function settle(now) {
  for (const g of G.groups) {
    if (g.isSleeping) {
      g.stillSince = null;
      continue;
    }
    if (
      now - g.born > 1000 &&
      Body.getSpeed(g) < CFG.settleSpeed &&
      Math.abs(Body.getAngularVelocity(g)) < CFG.settleSpin
    ) {
      if (g.stillSince == null) g.stillSince = now;
      else if (now - g.stillSince > CFG.settleTime) {
        Sleeping.set(g, true);
        g.stillSince = null;
      }
    } else g.stillSince = null;
  }
}
export function frame(now) {
  if (G.press && G.state === 'playing' && G.current && now - G.press.t0 > CFG.rotateDelay) {
    G.aimAngle += (CFG.rotateSpeed * Math.min(100, now - G.last)) / 1000;
    clampAim();
  }
  if (G.blend) updateBlend(now);
  if (G.engine && (G.state === 'playing' || G.state === 'clearing' || G.state === 'blending')) {
    acc += Math.min(100, now - G.last);
    while (acc >= STEP) {
      for (let i = 0; i < CFG.substeps; i++) {
        Engine.update(G.engine, STEP / CFG.substeps);
        processMerges();
      }
      acc -= STEP;
    }
    if (G.state === 'playing') checkOverflow(now);
    if (G.state !== 'blending') settle(now);
  }
  G.last = now;
  render(now);
  requestAnimationFrame(frame);
}
