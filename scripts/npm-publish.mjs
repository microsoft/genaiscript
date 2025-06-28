#!/usr/bin/env zx

import "zx/globals";

console.log("Publishing npm packages...");
let otp = await question("Please enter your npm 2FA code: ");
const cwd = process.cwd();
for (const d of ["core", "api", "runtime", "plugin-mdast", "cli"]) {
  console.log(`publishing ${d}`);
  cd(`packages/${d}`);
  const res =
    await $`pnpm publish --access public --otp ${otp} --publish-branch dev --no-git-checks`.nothrow();
  if (res.exitCode !== 0) {
    otp = await question("Please enter your npm 2FA code: ");
    await $`pnpm publish --access public --otp ${otp} --publish-branch dev --no-git-checks`;
  }
  cd(cwd);
}
