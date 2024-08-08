import "zx/globals"

const pkg = await fs.readJSON("./package.json")
pkg._enabledApiProposals = pkg.enabledApiProposals
pkg.displayName = "GenAIScript"
delete pkg.enabledApiProposals
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
await fs.rm("genaiscript.vsix", { force: true })
await fs.rm("genaiscript.manifest", { force: true })
console.log(`cleaned package.json`)
