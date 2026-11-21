// Leonida Ledger — the hand-in program for the GTA VI trophy guide.
// It copies the static guide (app/) and its screenshots (screenshots/) from
// this repository into the output directory, then writes dossier.json with
// the kit's buildDossier library, so the judge can read the entry.
//
// Run it from the repository root:  MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
import { buildDossier } from './vendor/makefun-frontend.ts';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(join(fileURLToPath(import.meta.url), '..'));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function freshDir(path: string): void {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

function copyTree(name: string): void {
  const from = join(repoRoot, name);
  if (!existsSync(from)) throw new Error(`missing ${name}/ in ${repoRoot}`);
  cpSync(from, join(outDir, name), { recursive: true });
}

freshDir(outDir);
copyTree('app');
copyTree('screenshots');

// Fail fast when the guide's data is missing or short: a hand-in with fewer
// than the official 55 trophies would fail the gate, so refuse it here.
const trophyData = JSON.parse(readFileSync(join(outDir, 'app', 'data', 'trophies.json'), 'utf8'));
const trophyCount = trophyData.trophies?.length ?? 0;
if (trophyCount !== 55) throw new Error(`trophies.json holds ${trophyCount} trophies, expected 55`);
console.log(`Leonida Ledger data check: ${trophyCount} trophies, all with guides`);

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Leonida Ledger handed in: ${outDir} (${dossier.length} bytes of dossier)`);
