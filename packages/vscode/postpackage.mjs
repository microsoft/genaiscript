import 'zx/globals'

await $`rm -Rf ./node_modules/pdfjs-dist`
await $`rm -Rf ./node_modules/tree-sitter-wasms`
await $`rm -Rf ./node_modules/web-tree-sitter`

const pkg = await fs.readJSON('./package.json')
pkg.enabledApiProposals = pkg._enabledApiProposals
pkg.displayName = "GenAIScript Insiders"
delete pkg._enabledApiProposals
await fs.writeJSON('./package.json', pkg, { spaces: 4 })
console.log(`cleaned package.json`)