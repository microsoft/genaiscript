#!/usr/bin/env zx

import 'zx/globals'

const { version } = await fs.readJSON('package.json')
console.log(`version: ${version}`)
const packages = await glob(['packages/*/package.json'])
let added = 0
for (const pkgp of packages) {
    console.log(`updated ${pkgp}`)
    const pkg = await fs.readJSON(pkgp)
    if (version !== pkg.version) {
        added++
        pkg.version = version
        await fs.writeJSON(pkgp, pkg, { spaces: 2 })
        $`git add ${pkgp}`
    }
}

if (added) {
    console.log(`git commit versions`)
    $`git commit -m "chore: bump version to ${version}"`
}
