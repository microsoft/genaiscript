script({
    tests: {
        keywords: "Python"
    }
})

const version = await host.exec("python", ["--version"])
if (version.exitCode)
    throw new Error(`Failed to get Python version: ${version.stderr}`)
$`Python version: ${version.stdout}`