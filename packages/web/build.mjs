import { build } from "esbuild"
import { cp } from "node:fs/promises"

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
await cp("./index.html", "../cli/built/index.html")