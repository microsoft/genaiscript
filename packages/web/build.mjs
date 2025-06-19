import { build } from "esbuild"
import { cp } from "node:fs/promises"
import { readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

await build({
    entryPoints: ["src/index.tsx"],
    bundle: true,
    minify: true,
    sourcemap: true,
    target: ["es2020"],
    format: "esm",
    outfile: "./dist/web.mjs",
    loader: { ".js": "jsx" },
    external: ["vscode"],
    define: {
        "process.env.NODE_ENV": '"production"',
    },
})
await cp("./dist/web.mjs", "../cli/dist/web.mjs")
await cp("./dist/web.mjs.map", "../cli/dist/web.mjs.map")
await cp("./index.html", "../cli/dist/index.html")
await cp("./favicon.svg", "../cli/dist/favicon.svg")
await cp(
    "node_modules/@vscode/codicons/dist/codicon.ttf",
    "../cli/dist/codicon.ttf"
)
await cp(
    "node_modules/@vscode/codicons/dist/codicon.css",
    "../cli/dist/codicon.css"
)

const cssDir = "./src"
const outputCssFile = "../cli/dist/markdown.css"
const cssFiles = (await readdir(cssDir))
    .filter((file) => file.endsWith(".css"))
    .map((f) => join(cssDir, f))
let concatenatedCss = ""
for (const filePath of cssFiles) {
    const fileContent = await readFile(filePath, "utf-8")
    concatenatedCss += fileContent + "\n"
}
await writeFile(outputCssFile, concatenatedCss)
