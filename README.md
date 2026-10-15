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

## Scripts

| Command                     | What it does                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`               | Dev server with hot reload                                                                                            |
| `npm run build`             | Production build to `dist/` (what Cloudflare Pages serves)                                                            |
| `npm run build:single-test` | Same single file with test mode always on (Colorado and Utah only), for the test artifact                             |
| `npm run build:single`      | One self-contained `dist-single/index.html` with everything inlined, for claude.ai artifacts or sharing a single file |
| `npm run preview`           | Serve the `dist/` build locally to check it before deploying                                                          |
| `npm run build:map`         | Regenerate `src/data/states.json` from Census boundary data                                                           |
| `npm run format`            | Format the code with Prettier                                                                                         |

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

## Deploying to Cloudflare Pages

The repo deploys automatically: every push to `main` goes live, and every other branch gets its own preview URL.

### One-time setup

1. Push this repo to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages**, create a new **Pages** application, and choose to connect a Git repository. Pick this repo.
3. Use these build settings:
   - Framework preset: **Vite** (or None)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version comes from `.nvmrc`; no environment variables are needed.
4. Save and deploy.

> **Moving from the old drag-and-drop project:** Cloudflare can't switch an existing direct-upload Pages project to Git. Create a new project as above. If you want to keep the same `*.pages.dev` name, delete the old project first. A custom domain can be moved from the old project to the new one.

### Day-to-day

```bash
git checkout -b my-change     # work on a branch
npm run dev                   # try it locally
git push -u origin my-change  # Cloudflare builds a preview URL for the branch
# merge to main when happy -> production deploys automatically
```

Rolling back is one click: in the Pages project, open **Deployments** and roll back to any earlier build.

### Updating the claude.ai artifact

```bash
npm run build:single
```

Then publish `dist-single/index.html` as the game artifact. For the test artifact, run `npm run build:single-test` and publish `dist-single-test/index.html` (it's fully self-contained, about 350 kB).

## Map data

`src/data/states.json` is generated and committed, so normal builds don't need the map tools. Run `npm run build:map` only to change how the map is processed. The script reads U.S. Census Bureau state boundaries from the `us-atlas` package (Albers projection), finds shared borders with `topojson-client`, simplifies outlines with `simplify-js`, and splits each shape into convex pieces with `poly-decomp`. With the pinned versions it reproduces the committed file exactly.

## Notes

- **Matter.js is pinned at 0.19.0**, the version the physics was tuned against. 0.20 exists; upgrade deliberately and re-check merges, stacking and Blend It!.
- **Fonts:** Public Sans is bundled from `@fontsource` (Latin subset only), so the game makes no third-party requests.
- **`npm audit`** reports a high-severity issue in `braces`, pulled in through `vite-plugin-singlefile`. It affects build tooling only, never the shipped game. Don't run `npm audit fix --force`; it downgrades the plugin to a broken version.
- **Saved data:** best score and mute setting are stored in `localStorage` under `merge-everything-*` keys (see `STORAGE_KEYS` in `src/config.js`). The game was first released as Suika States; values saved under the old `suika-states-*` keys are copied over once on load.
- Music is an original composition, synthesized at runtime; there are no audio files.
