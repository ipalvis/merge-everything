/*
 * Shared, mutable game state.
 *
 * Anything that more than one module reads AND reassigns lives here, so modules can share it
 * without circular `let` exports. Values that only one module uses stay private to that module.
 */
import { CFG, VW } from './config.js';

export const G = {
  // flow: 'title' | 'playing' | 'blending' | 'bankpick' | 'banking' | 'clearing' | 'won' | 'over'
  state: 'title',

  // physics world (rebuilt every round by setupWorld)
  engine: undefined,
  world: undefined,
  groups: [], // every piece in the box (Matter compound bodies)
  walls: [], // static bodies: box walls, plus the lid during Blend It!

  // round progress and scoring
  score: 0,
  best: 0,
  round: 1,
  deck: [], // pieces still to drop; the last element is next
  current: null, // the piece waiting to drop
  clearTimer: undefined,

  // aiming and dropping
  aimX: VW / 2,
  aimAngle: 0, // rotation of the piece waiting to drop
  press: null, // the current pointer press (hold to rotate)
  lastDrop: 0,

  // Blend It!: the active spin, and uses left this round
  blend: null,
  blendsLeft: CFG.blendsPerRound,

  // Bank: banked piece; 'ready' | 'holding' | 'spent' (once per round); piece being offered
  bank: null,
  bankPhase: 'ready',
  bankTarget: null,

  // effects and timing
  lastShake: -1e9,
  dangerSince: null, // when the pile first sat above the red line, or null
  flashes: [], // recent merges to glow
  last: performance.now(), // time of the previous frame
};
