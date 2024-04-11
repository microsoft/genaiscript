import 'zx/globals'

await fs.rm('./node_modules/pdfjs-dist', { recursive: true })
await fs.rm('./node_modules/tree-sitter-wasms', { recursive: true })
await fs.rm('./node_modules/web-tree-sitter', { recursive: true })

const pkg = await fs.readJSON('./package.json')
pkg.enabledApiProposals = pkg._enabledApiProposals
pkg.displayName = "GenAIScript Insiders"
delete pkg._enabledApiProposals
await fs.writeJSON('./package.json', pkg, { spaces: 4 })
console.log(`cleaned package.json`)