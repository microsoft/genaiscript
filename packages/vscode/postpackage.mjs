import "zx/globals"

const pkg = await fs.readJSON("./package.json")
pkg.enabledApiProposals = pkg._enabledApiProposals
pkg.contributes.chatParticipants = pkg._chatParticipants
pkg.displayName = "GenAIScript Insiders"
delete pkg._enabledApiProposals
delete pkg._chatParticipants
await fs.writeJSON("./package.json", pkg, { spaces: 4 })
console.log(`cleaned package.json`)
