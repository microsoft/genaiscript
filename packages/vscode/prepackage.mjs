import "zx/globals"

const pkg = await fs.readJSON("./package.json")
pkg._enabledApiProposals = pkg.enabledApiProposals
pkg._chatParticipants = pkg.contributes.chatParticipants
pkg.displayName = "GenAIScript"
delete pkg.enabledApiProposals
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
await fs.rm("genaiscript.vsix", { force: true })
await fs.rm("genaiscript.manifest", { force: true })
await fs.cpSync("../../docs/src/content/docs/getting-started/tutorial.md", "./tutorial.md")
console.log(`cleaned package.json`)
