import "zx/globals"

const pkg = await fs.readJSON("./package.json")
pkg.enabledApiProposals = pkg._enabledApiProposals
pkg.displayName = "GenAIScript Insiders"
delete pkg._enabledApiProposals
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
console.log(`cleaned package.json`)
