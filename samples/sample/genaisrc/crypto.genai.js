script({ tests: {} })
const data = new Uint8Array(16)
const rnd = crypto.getRandomValues(data)

$`Print "${rnd}".`