import * as esbuild from "esbuild"
import { readFile, writeFile } from "fs/promises"
import pkg from "./package.json" with { type: "json" }
import assert from "node:assert/strict"
const external = [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.optionalDependencies),
]
console.log(`external: ${external.join(",\n")}`)
assert(
    external.length > 0,
    "No external dependencies found in package.json. Please add them to the 'external' field."
)

/** @type {import('esbuild').BuildOptions} */
const config = {
    entryPoints: ["src/main.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node20",
    outfile: "built/genaiscript.cjs",
    sourcemap: true,
    metafile: true,
    external,
}

const result = await esbuild.build(config)
await writeFile(
    "built/metafile.json",
    JSON.stringify(result.metafile, null, 2),
    { encoding: "utf-8" }
)
const stats = await esbuild.analyzeMetafile(result.metafile)
await writeFile("built/stats.txt", stats, { encoding: "utf-8" })
console.debug(stats.split("\n").slice(0, 20).join("\n"))

const js = await readFile("built/genaiscript.cjs", { encoding: "utf-8" })
const patched = "#!/usr/bin/env node\n" + js
await writeFile("built/genaiscript.cjs", patched, { encoding: "utf-8" })
