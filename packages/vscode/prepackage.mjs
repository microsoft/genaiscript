import "zx/globals"

// workaround yarn workspaces
await fs.rmdir("./node_modules", { recursive: true })
for (const m of [
    "pdfjs-dist",
    "tree-sitter-wasms",
    "web-tree-sitter",
    "tsx",
    "esbuild",
    "get-tsconfig",
    "resolve-pkg-maps"
]) {
    await fs.copy(`../../node_modules/${m}`, `./node_modules/${m}`, {
        recursive: true,
    })
}

const pkg = await fs.readJSON("./package.json")
pkg._enabledApiProposals = pkg.enabledApiProposals
pkg.displayName = "GenAIScript"
delete pkg.enabledApiProposals
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
console.log(`cleaned package.json`)
