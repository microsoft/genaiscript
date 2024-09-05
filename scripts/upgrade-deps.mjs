#!/usr/bin/env zx
import "zx/globals"

const autos = [
    "astro",
    "@astro/starlight",
    "@slidev/cli",
    "ini",
    "openai",
    "tsx",
    "@vscode/vsce",
    "yaml",
    "zx",
]
const branch = `deps/${new Date().toISOString().replace(/[^0-9]/g, "-")}`

await $`npx --yes ncu -u --deep ${autos.join(" ")}`
await $`yarn install:force`
await $`yarn typecheck`
await $`yarn compile`
await $`git checkout -b ${branch}`
await $`git add .`
await $`git commit -m "upgrading dependencies" -n`
await $`git push -u origin ${branch}`
