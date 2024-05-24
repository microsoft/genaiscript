import "zx/globals"

// workaround yarn workspaces
await fs.copy('../../node_modules/pdfjs-dist', './node_modules/pdfjs-dist', { recursive: true })
await fs.copy('../../node_modules/tree-sitter-wasms', './node_modules/tree-sitter-wasms', { recursive: true })
await fs.copy('../../node_modules/web-tree-sitter', './node_modules/web-tree-sitter', { recursive: true })

const pkg = await fs.readJSON("./package.json")
pkg._enabledApiProposals = pkg.enabledApiProposals
pkg.displayName = "GenAIScript"
delete pkg.enabledApiProposals
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
console.log(`cleaned package.json`)
