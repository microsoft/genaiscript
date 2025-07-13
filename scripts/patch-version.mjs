#!/usr/bin/env zx

import "zx/globals";

const { version } = await fs.readJSON("package.json");
console.log(`version: ${version}`);
const packages = await glob([
  "packages/*/package.json",
  "docs/package.json",
  "examples/action/package.json",
  "slides/package.json",
]);
for (const pkgp of packages) {
  console.log(`updated ${pkgp}`);
  const pkg = await fs.readJSON(pkgp);
  if (version !== pkg.version) {
    pkg.version = version;
    await fs.writeJSON(pkgp, pkg, { spaces: 2 });
  }
}
