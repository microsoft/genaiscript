import * as esbuild from "esbuild"
import { writeFile } from "fs/promises"
import pkg from "../../package.json" with { type: "json" }
import assert from "node:assert/strict"
const external = pkg.external
assert(
    external.length > 0,
    "No external dependencies found in package.json. Please add them to the 'external' field."
)

/** @type {import('esbuild').BuildOptions} */
const config = {
    entryPoints: ["src/main.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: "built/genaiscript.cjs",
    sourcemap: true,
    metafile: true,
    external
}

const result = await esbuild.build(config)
const stats = await esbuild.analyzeMetafile(result.metafile)
await writeFile("built/stats.txt", stats, { encoding: "utf-8" })
