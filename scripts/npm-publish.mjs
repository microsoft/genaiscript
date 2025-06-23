#!/usr/bin/env zx

import "zx/globals"

console.log("Publishing npm packages...")
const otp = await question('Please enter your npm 2FA code: ')
const cwd = process.cwd()
for(const d of ["core", "globals", "api", "runtime", "cli"]) {
    console.log(`publishing ${d}`)
    cd(`packages/${d}`)
    await $`pnpm publish --access public --otp ${otp} --publish-branch dev --no-git-checks`
    cd(cwd)
}
