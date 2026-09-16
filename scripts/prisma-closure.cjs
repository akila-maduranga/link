#!/usr/bin/env node
/**
 * prisma-closure.cjs — copy the Prisma CLI + its FULL dependency closure.
 *
 * Why: the Docker runtime stage runs `prisma db push` at container boot (see
 * docker-entrypoint.sh). Modern Prisma CLIs require more than just `prisma/`
 * and `@prisma/engines/` — they also need @prisma/debug, @prisma/get-platform,
 * @prisma/engines-version, @prisma/fetch-engine … (the exact set depends on
 * the prisma version). Copying only two folders ships an image that
 * crash-loops with:  Error: Cannot find module '@prisma/debug'
 *
 * This script walks package.json "dependencies" starting from `prisma`,
 * copies every package it finds into <out>/node_modules/, and FAILS LOUDLY
 * if a required package is missing — so a broken image can never build.
 * It then prunes files the runtime never loads (query engines, the TS peer,
 * the ESM client-generator dir) — verified empirically against `db push`.
 *
 * Usage:
 *   node prisma-closure.cjs [--root <node_modules>] --out <dir> [pkg ...]
 *     --root     source node_modules dir   (default: ./node_modules)
 *     --out      destination root dir      (packages land in <out>/node_modules/)
 *     [pkg]      packages to start from    (default: prisma)
 *
 * There is deliberately NO exclusion flag. prisma 6.19's CLI eagerly
 * `require("@prisma/config")` at the top level of build/index.js (and
 * @prisma/config pulls c12/effect/deepmerge-ts/empathic). Excluding any
 * hard dependency ships an image that crash-loops with MODULE_NOT_FOUND —
 * exactly what happened twice before this rule existed. If you want a
 * smaller payload, prune by FILE patterns (below), never by package.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------- args -----
const argv = process.argv.slice(2);
let root = path.resolve('node_modules');
let out = null;
const roots = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root')    { root = path.resolve(argv[++i]); continue; }
  if (argv[i] === '--out')     { out = path.resolve(argv[++i]); continue; }
  if (argv[i] === '--exclude') {
    console.error('prisma-closure: --exclude is no longer supported — excluding a hard');
    console.error('dependency of the prisma CLI ships an image that crash-loops');
    console.error('(prisma 6.19 eagerly requires @prisma/config). Prune by FILE pattern instead.');
    process.exit(1);
  }
  roots.push(argv[i]);
}
if (!out) {
  console.error('prisma-closure: --out <dir> is required');
  process.exit(1);
}
if (roots.length === 0) roots.push('prisma');

if (!fs.existsSync(path.join(root, 'prisma', 'package.json'))) {
  console.error(`prisma-closure: ${root}/prisma/package.json not found (bad --root?)`);
  process.exit(1);
}

// ------------------------------------------------------------- helpers -----
/** Resolve a package dir: top-level first, then nested beside `fromDir`. */
function resolvePkg(name, fromDir) {
  const candidates = fromDir
    ? [path.join(root, name),
       path.join(root, fromDir, 'node_modules', name)]
    : [path.join(root, name)];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'package.json'))) return c;
  }
  return null;
}

function dirSize(p) {
  let total = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, e.name);
    if (e.isDirectory()) total += dirSize(full);
    else if (e.isFile()) { try { total += fs.statSync(full).size; } catch { /* ignore */ } }
  }
  return total;
}

// ---------------------------------------------------------------- walk -----
const copied = [];       // { name, dir, bytes }
const seen = new Set();  // package names already handled
const missingRequired = [];
const missingOptional = [];
const queue = roots.map((name) => ({ name, fromDir: null }));

while (queue.length > 0) {
  const { name, fromDir } = queue.shift();
  if (seen.has(name)) continue;
  seen.add(name);

  const dir = resolvePkg(name, fromDir);
  if (!dir) {
    if (fromDir === null) {
      // one of the explicitly requested roots — always fatal
      missingRequired.push(name);
    } else {
      missingOptional.push(`${name} (wanted by ${fromDir})`);
    }
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  copied.push({ name, dir, bytes: dirSize(dir) });

  // dependencies         → must exist, fatal if missing
  // optionalDependencies → warn if missing (platform-specific is fine)
  // peerDependencies      → deliberately NOT walked: peers are consumer
  //                         concerns (prisma's "typescript" peer only serves
  //                         TS-based config files — db push on a plain
  //                         schema.prisma never loads it; verified live)
  const hard = Object.keys(pkg.dependencies || {});
  const soft = Object.keys(pkg.optionalDependencies || {});

  for (const dep of hard) queue.push({ name: dep, fromDir: name });
  for (const dep of soft) queue.push({ name: dep, fromDir: name });
}

// ---------------------------------------------------------------- copy -----
const destModules = path.join(out, 'node_modules');
fs.rmSync(destModules, { recursive: true, force: true });
fs.mkdirSync(destModules, { recursive: true });

for (const { name, dir, bytes } of copied) {
  const dest = path.join(destModules, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(dir, dest, { recursive: true });
  copied.find((c) => c.name === name).bytes = bytes; // keep for report
}

// ---------------------------------------------------------------- prune -----
// The runtime container only ever runs `prisma db push --skip-generate`
// (boot-time schema sync) — that needs the SCHEMA engine + schema WASM,
// nothing else. These are pure dead weight in the runtime image (the app's
// own query engine ships pre-generated inside .next/standalone's
// node_modules/.prisma/client):
//   • libquery_engine-*.so.node  — query-engine binaries (postinstall files)
//   • prisma/build/query_engine_bg.*.wasm — WASM query engines
//   • prisma/prisma-client/      — the ESM client generator's runtime files
// Verified empirically: db push passes fresh AND idempotent without them.
function pruneDir(dir, pattern, label) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (pattern.test(f)) {
      fs.rmSync(path.join(dir, f), { recursive: true, force: true });
      console.log(`prisma-closure: pruned ${label}: ${f}`);
    }
  }
}
pruneDir(path.join(destModules, 'prisma'),             /^libquery_engine-.*\.node$/,      'query-engine binary');
pruneDir(path.join(destModules, '@prisma', 'engines'), /^libquery_engine-.*\.node$/,      'query-engine binary');
pruneDir(path.join(destModules, 'prisma', 'build'),    /^query_engine_bg\..*\.wasm$/,     'WASM query engine');
pruneDir(path.join(destModules, 'prisma'),             /^prisma-client$/,                  'client generator dir');

// --------------------------------------------------------------- report ----
// re-measure AFTER pruning so the reported size is what actually ships
for (const c of copied) {
  const dest = path.join(destModules, c.name);
  c.bytes = fs.existsSync(dest) ? dirSize(dest) : 0;
}
const totalBytes = copied.reduce((s, c) => s + c.bytes, 0);
const mb = (totalBytes / 1024 / 1024).toFixed(1);
console.log(`prisma-closure: ${copied.length} packages, ${mb} MB`);
for (const c of copied.sort((a, b) => b.bytes - a.bytes)) {
  console.log(`  ${(c.bytes / 1024).toFixed(0).padStart(7)} KB  ${c.name}`);
}

for (const m of missingOptional) console.warn(`prisma-closure: WARN optional dep not installed: ${m}`);

if (missingRequired.length > 0) {
  console.error('prisma-closure: FATAL — required packages missing from node_modules:');
  for (const m of missingRequired) console.error(`  - ${m}`);
  console.error('The runtime image would crash-loop. Run `npm ci` first.');
  process.exit(1);
}
