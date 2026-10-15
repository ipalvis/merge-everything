/* Test mode: open the game with ?test=1 to deal only these states; connecting them completes the round.
   Useful for checking the win popup and Endless mode without assembling all 48.
   A build can also force it on (see .env.single-test), which is how the test artifact is made. */
const FORCE_TEST = import.meta.env.VITE_FORCE_TEST === '1';
export const TEST_IDS = FORCE_TEST || new URLSearchParams(location.search).has('test') ? ['CO', 'UT'] : null;

/* Saved data (localStorage). The game was first released as "Suika States"; saved values under the
   old key names are copied to the new names once, so players keep their best score and mute setting. */
export const STORAGE_KEYS = {
  best: TEST_IDS ? 'merge-everything-test-best' : 'merge-everything-best',
  muted: 'merge-everything-muted',
};
try {
  for (const [from, to] of [
    ['suika-states-best', 'merge-everything-best'],
    ['suika-states-test-best', 'merge-everything-test-best'],
    ['suika-states-muted', 'merge-everything-muted'],
  ])
    if (localStorage.getItem(to) === null && localStorage.getItem(from) !== null)
      localStorage.setItem(to, localStorage.getItem(from));
} catch (e) {}

// prettier-ignore
export const CFG = {
  boxW: 600, boxH: 560, pad: 12,       // logical box size (inner width/height)
  mapFill: 0.96,                      // assembled US map width as a share of box width
  dangerY: 168, dangerStepPerRound: 25, dangerMax: 190,   // starts 5% of the box lower than originally; 190 is the lowest it can go and still fit the full map
  overflowGrace: 2000, overflowLimit: 2500,
  dropCooldown: 500,
  rotateSpeed: Math.PI,               // radians per second while the waiting piece is held (half a turn per second)
  rotateDelay: 120,                   // ms of holding before it starts to spin, so a quick click drops it unrotated
  ringGap: 3,                         // space between the waiting piece's farthest point and the rotation arrows circling it
  blendsPerRound: 3,                  // Blend It! uses per round (refills when a new round starts)
  blendDuration: 6000, blendTurns: 2, blendScale: 0.68,   // Blend It!: length (ms), full turns, how small the box shrinks while spinning. Slower = pieces tumble along the walls instead of floating
  shakeDuration: 900,                 // how long the box visibly shakes (ms)
  shakeCooldown: 1000,                // Shake is available again this soon after pressing it (just after the shake ends)
  gravity: 1.6,                       // Matter default is 1
  cornerRadius: 2.5,                  // invisible rounding on physics corners (outlines are drawn unrounded)
  snapTolerance: 3,                   // a merge snaps into map position only if that spot overlaps other pieces by at most this many px
  snapRetry: 250,                     // ms to wait before retrying a merge that had no room
  substeps: 3,                        // physics steps per frame; smaller steps stop big pieces from rocking and gaining energy
  sleepMotion: 0.017,                 // Matter's "at rest" threshold, measured per substep (default 0.08 per full step)
  settleSpeed: 0.3, settleSpin: 0.005, settleTime: 500,   // backstop: barely moving this long -> freeze until touched
  pts: { mergePerState: 10, division: 100, region: 250, complete: 1000 }
};
// prettier-ignore
export const DIVISIONS = {
  "New England":["CT","ME","MA","NH","RI","VT"], "the Mid-Atlantic":["NJ","NY","PA"],
  "the East North Central":["IL","IN","MI","OH","WI"], "the West North Central":["IA","KS","MN","MO","NE","ND","SD"],
  "the South Atlantic":["DE","FL","GA","MD","NC","SC","VA","WV"], "the East South Central":["AL","KY","MS","TN"],
  "the West South Central":["AR","LA","OK","TX"], "the Mountain West":["AZ","CO","ID","MT","NV","NM","UT","WY"],
  "the Pacific Coast":["CA","OR","WA"]
};
// prettier-ignore
export const REGIONS = {
  "the Northeast":["CT","ME","MA","NH","RI","VT","NJ","NY","PA"],
  "the Midwest":["IL","IN","MI","OH","WI","IA","KS","MN","MO","NE","ND","SD"],
  "the South":["DE","FL","GA","MD","NC","SC","VA","WV","AL","KY","MS","TN","AR","LA","OK","TX"],
  "the West":["AZ","CO","ID","MT","NV","NM","UT","WY","CA","OR","WA"]
};
export const VW = CFG.boxW + CFG.pad * 2,
  VH = CFG.boxH + CFG.pad; // logical canvas size
export const BOX = { l: CFG.pad, r: CFG.pad + CFG.boxW, b: CFG.boxH };
