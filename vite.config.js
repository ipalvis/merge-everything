import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`             -> dist/              normal multi-file site (what Cloudflare Pages serves)
// `npm run build:single`      -> dist-single/       one self-contained index.html (for claude.ai artifacts or sharing a file)
// `npm run build:single-test` -> dist-single-test/  the same, with test mode always on (loads .env.single-test)
const SINGLE = { single: 'dist-single', 'single-test': 'dist-single-test' };

export default defineConfig(({ mode }) =>
  SINGLE[mode] ? { plugins: [viteSingleFile()], build: { outDir: SINGLE[mode] } } : { build: { outDir: 'dist' } },
);
