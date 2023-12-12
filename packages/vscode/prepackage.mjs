import 'zx/globals'

const pkg = await fs.readJSON('./package.json')
delete pkg.enabledApiProposals
await fs.writeJSON('./package.json', pkg, { spaces: 2 })
console.log(`cleaned package.json`)