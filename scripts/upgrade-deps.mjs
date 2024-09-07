#!/usr/bin/env zx
import "zx/globals"

const autos = [
    "astro",
    "@astrojs/starlight",
    "@slidev/cli",
    "@inquirer/prompts",
    "eslint",
    "ini",
    "openai",
    "playwright",
    "tsx",
    "@vscode/vsce",
    "yaml",
    "zx",
]
const branch = `deps/${new Date().toISOString().replace(/[^0-9]/g, "-")}`

await $`ncu -u --deep ${autos.join(" ")}`.verbose(true)
await $`yarn install:force`

const status = await $`git status --porcelain`
if (!status.stdout.trim()) {
    console.log("No changes, exiting")
    process.exit(0)
}

await $`yarn typecheck`
await $`yarn compile`
await $`git checkout -b ${branch}`
await $`git add .`
await $`git commit -m "upgrading dependencies" -n`
await $`git push -u origin ${branch}`
await $`gh pr create -f --base main --head ${branch} --title "Upgrading dependencies" --body "This PR upgrades the dependencies"`
await $`git checkout main`
