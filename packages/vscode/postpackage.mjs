import 'zx/globals'

const pkg = await fs.readJSON('./package.json')
pkg.enabledApiProposals = pkg._enabledApiProposals
pkg.displayName = "GPTools Insiders"
delete pkg._enabledApiProposals
await fs.writeJSON('./package.json', pkg, { spaces: 2 })
console.log(`cleaned package.json`)