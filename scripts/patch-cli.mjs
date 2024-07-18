#!/usr/bin/env zx

import "zx/globals"

let clijs = await fs.readFile('built/genaiscript.cjs', { encoding: 'utf-8' })
clijs = '#!/usr/bin/env node\n' + clijs
await fs.writeFile('built/genaiscript.cjs', clijs, { encoding: 'utf-8' })
