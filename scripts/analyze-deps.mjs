#!/usr/bin/env node
// analyze-pnpm-sizes.js – ESM, Node ≥ 18
//
// Calculates the disk usage of every dependency (direct *and* transitive)
// in a pnpm monorepo.  Works offline and does not traverse workspace code;
// only the packages stored under node_modules/.pnpm are measured.
//
// © 2025  MIT-licensed.  Feel free to adapt.

import { promises as fs } from 'fs';
import path from 'path';

////////////////////////////////////////////////////////////////////////////////
// helpers
////////////////////////////////////////////////////////////////////////////////

async function getPnpmStoreDir(cwd = process.cwd()) {
  // 1. Try local .pnpm inside node_modules (project standard since pnpm v8)
  const localStore = path.join(cwd, 'node_modules', '.pnpm');
  try {
    const st = await fs.stat(localStore);
    if (st.isDirectory()) return localStore;
  } catch { /* not there */ }

  // 2. Fallback: ask pnpm directly (handles shared/global store layouts)
  //     > pnpm store path
  // We shell-out only if absolutely needed.
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileP = promisify(execFile);

  const { stdout } = await execFileP('pnpm', ['store', 'path'], { cwd });
  return stdout.trim(); // e.g. “/Users/foo/Library/pnpm/store/v3”
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(res);
    else if (e.isFile()) yield res;
  }
}

async function folderSizeBytes(dir) {
  let total = 0;
  for await (const file of walk(dir)) {
    const { size } = await fs.stat(file);
    total += size;
  }
  return total;
}

////////////////////////////////////////////////////////////////////////////////
// main
////////////////////////////////////////////////////////////////////////////////

const human = (bytes) => {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, n = bytes;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
};

(async () => {
  const storeDir = await getPnpmStoreDir();
  console.log(`🔍 Scanning pnpm store: ${storeDir}\n`);

  const pkgs = await fs.readdir(storeDir, { withFileTypes: true });
  const results = [];

  // Limit concurrency so we don’t exhaust open-file handles
  const CONCURRENCY = 8;
  const queue = [...pkgs.filter((d) => d.isDirectory())];

  async function worker() {
    while (queue.length) {
      const entry = queue.pop();
      if (!entry) break;
      const dir = path.join(storeDir, entry.name);

      // entry.name looks like “chalk@5.3.0”
      const at = entry.name.lastIndexOf('@');
      const name = entry.name.slice(0, at);

      const bytes = await folderSizeBytes(dir);
      results.push({ name, versionedFolder: entry.name, bytes });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Sort by size DESC and aggregate by package name
  results.sort((a, b) => b.bytes - a.bytes);

  const agg = {};
  for (const { name, bytes } of results) {
    agg[name] = (agg[name] ?? 0) + bytes;
  }
  const aggregated = Object.entries(agg)
    .map(([name, bytes]) => ({ name, size: human(bytes), bytes }))
    .sort((a, b) => b.bytes - a.bytes);

  // Show top 30 (or all if fewer)
  console.table(aggregated.slice(0, 30), ['name', 'size']);

  const total = aggregated.reduce((t, { bytes }) => t + bytes, 0);
  console.log(`\n📦  Total size of all stored packages: ${human(total)}\n`);
})();
