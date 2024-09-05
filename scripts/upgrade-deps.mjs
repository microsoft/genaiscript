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
const branch = `deps/${new Date().toISOString()}`

$`git checkout -b ${branch}`
$`npx --yes npm-check-udpates -u --deep ${autos.join(" ")}`
$`yarn install:force`
$`yarn typecheck`
$`yarn compile`
$`git add .`
$`git commit -m "upgrading dependencies" -n`
$`git push -u origin ${branch}`
