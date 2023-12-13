import 'zx/globals'

const pkg = await fs.readJSON('./package.json')
pkg._enabledApiProposals = pkg.enabledApiProposals
pkg.displayName = "GPTools"
delete pkg.enabledApiProposals
await fs.writeJSON('./package.json', pkg, { spaces: 2 })
console.log(`cleaned package.json`)