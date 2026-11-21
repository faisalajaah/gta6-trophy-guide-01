// Leonida Ledger — the GTA VI trophy guide & tracker, as a make.fun entry.
//
// The guide itself is the static site in app/ (plain HTML, ES modules and CSS,
// no build step): open app/index.html in a browser and it runs offline, loading
// nothing over the network — the trophy list and every guide live in
// app/data/trophies.json, and progress is kept in the browser's localStorage.
// What this file does is hand that site in: it copies app/ and screenshots/
// from next to this file into the output directory and writes
// /output/dossier.json, the summary the judge reads, using the vendored
// make.fun helper. Leave vendor/makefun-frontend.ts untouched — the scorer
// only accepts a dossier.json that its own copy of that helper produced.
//
// Run it outside the grader's container with MAKEFUN_OUTPUT_DIR standing
// in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the result locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// This file's own folder, and the folder the grader collects the entry from.
const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a whole directory tree, creating the destination as needed.
function copyTree(from, to) {
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(root, 'app'), join(outDir, 'app'));

const shotsDir = join(outDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  copyTree(join(root, 'screenshots'), shotsDir);
}

// The scorer's own caps (reference/gate.json). Only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse — more than 4
// screenshots, or one over 256 KiB; more than 993 files and directories in
// app/, or 48 MiB of app files (app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
const dossier = buildDossier(outDir, DOSSIER_CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);
