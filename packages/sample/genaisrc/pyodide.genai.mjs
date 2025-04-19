script({
    model:"small",
    tests: {}
})
const py = await host.python()
const version = await py.run(`import sys
                              sys.version`)
console.log(version)