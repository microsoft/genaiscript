import "zx/globals"

for (const m of [
    "pdfjs-dist",
    "tree-sitter-wasms",
    "web-tree-sitter",
    "tsx",
    "esbuild",
    "get-tsconfig",
    "resolve-pkg-maps",
    "gpt-3-encoder",
])
    await fs.rm(`./node_modules/${m}`, { recursive: true })

const pkg = await fs.readJSON("./package.json")
pkg.enabledApiProposals = pkg._enabledApiProposals
pkg.displayName = "GenAIScript Insiders"
delete pkg._enabledApiProposals
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
console.log(`cleaned package.json`)
