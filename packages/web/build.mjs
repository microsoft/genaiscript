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
    outfile: "./built/web.mjs",
    loader: { ".js": "jsx" },
    external: ["vscode"],
    define: {
        "process.env.NODE_ENV": '"production"',
    },
})
await cp("./built/web.mjs", "../cli/built/web.mjs")
await cp("./built/web.mjs.map", "../cli/built/web.mjs.map")
await cp("./index.html", "../cli/built/index.html")
await cp("./favicon.svg", "../cli/built/favicon.svg")

const cssDir = "./src"
const outputCssFile = "../cli/built/markdown.css"
const cssFiles = (await readdir(cssDir)).filter(file => file.endsWith(".css"))
let concatenatedCss = ""
for (const file of cssFiles) {
    const filePath = join(cssDir, file)
    const fileContent = await readFile(filePath, "utf-8")
    concatenatedCss += fileContent + "\n"
}
await writeFile(outputCssFile, concatenatedCss)