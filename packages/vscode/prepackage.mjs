import "zx/globals"

// workaround yarn workspaces
await $`cp -R ../../node_modules/pdfjs-dist ./node_modules`
await $`cp -R ../../node_modules/tree-sitter-wasms ./node_modules`
await $`cp -R ../../node_modules/web-tree-sitter ./node_modules`

const pkg = await fs.readJSON("./package.json")
pkg._enabledApiProposals = pkg.enabledApiProposals
pkg.displayName = "GenAIScript"
delete pkg.enabledApiProposals
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
console.log(`cleaned package.json`)
