# Merge Everything!

Drop U.S. states into a box. States that border each other on the real map stick together and snap into place. Assemble all 48 contiguous states before the pile overflows the red line.

Built with plain JavaScript, [Matter.js](https://brm.io/matter-js/) for physics, and the Web Audio API for music and sound effects. [Vite](https://vite.dev/) bundles it.

## Quick start

Requires Node.js 22.12 or newer (see `.nvmrc`).

```bash
npm install
npm run dev        # local dev server with hot reload, usually http://localhost:5173
```

Open `http://localhost:5173/?test=1` for **test mode**: only Colorado and Utah are dealt, and connecting them wins the round. Use it to check the win popup and Endless mode quickly. Test mode keeps its own best score.


## Project structure

```
index.html            page markup (HUD, buttons, dialogs)
src/
  main.js             entry point: loads modules, wires buttons, starts the loop
  styles.css          all styles, light and dark themes, self-hosted font
  config.js           CFG tunables, Census divisions and regions, box size, test mode flag
  state.js            G: shared mutable game state (score, round, deck, pieces, flow state)
  data/states.json    generated map data (outlines, convex physics pieces, neighbors)
  map/geometry.js     scales map data, builds STATES, pieces, clusters, colors, stick-to rules
  physics/world.js    Matter.js world, building piece bodies, merge detection and snapping
  game/
    game.js           rounds, scoring, win popup, Endless mode, game over
    loop.js           main loop: fixed-step physics, overflow check, settle backstop
    aim.js            aiming, hold-to-rotate, dropping
    shake.js          Shake the box
    blend.js          Blend It!
    bank.js           Bank a piece
    giveUp.js         two-tap Give up
  input/input.js      pointer and keyboard input
  render/render.js    canvas drawing: box, pieces, danger line, aim preview, rotation ring
  ui/                 canvas sizing, theme, HUD, toasts, confetti, DOM helper
  audio/sound.js      synthesized music sequencer and sound effects, mute
scripts/
  build-map.mjs       offline map-data pipeline (us-atlas -> states.json)
```

**How state is shared:** anything that more than one module reads and changes lives on the `G` object in `src/state.js` (for example `G.score`, `G.state`, `G.groups`). Values only one module uses stay private to that module. Constants live in `src/config.js`.

**Tuning gameplay:** almost everything is in `CFG` in `src/config.js`: gravity, danger line, cooldowns, Blend It! uses, scoring. Audio levels and tempo are at the top of `src/audio/sound.js`.


## Notes

- **Matter.js is pinned at 0.19.0**, the version the physics was tuned against. 0.20 exists; upgrade deliberately and re-check merges, stacking and Blend It!.
- **Fonts:** Public Sans is bundled from `@fontsource` (Latin subset only), so the game makes no third-party requests.
- **`npm audit`** reports a high-severity issue in `braces`, pulled in through `vite-plugin-singlefile`. It affects build tooling only, never the shipped game. Don't run `npm audit fix --force`; it downgrades the plugin to a broken version.
- **Saved data:** best score and mute setting are stored in `localStorage` under `merge-everything-*` keys (see `STORAGE_KEYS` in `src/config.js`). The game was first released as Suika States; values saved under the old `suika-states-*` keys are copied over once on load.
- Music is an original composition, synthesized at runtime; there are no audio files.
