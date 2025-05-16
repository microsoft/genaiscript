import * as esbuild from "esbuild"
import { writeFile } from "fs/promises"

/** @type {import('esbuild').BuildOptions} */
const config = {
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node20",
    outfile: "built/extension.js",
    sourcemap: true,
    metafile: true,
    external: ["vscode", "pdfjs-dist", "@napi-rs/canvas"],
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
