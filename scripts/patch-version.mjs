#!/usr/bin/env zx

import 'zx/globals'

const { version } = await fs.readJSON('package.json')
console.log(`version: ${version}`)
const packages = await glob(['packages/*/package.json'])
for (const pkgp of packages) {
    console.log(`updated ${pkgp}`)
    const pkg = await fs.readJSON(pkgp)
    pkg.version = version
    await fs.writeJSON(pkgp, pkg, { spaces: 2 })
}