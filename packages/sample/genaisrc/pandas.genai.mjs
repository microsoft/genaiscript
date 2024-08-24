script({ tests: {} })
const container = await host.container({
    image: "python:3.12",
    networkEnabled: true,
})
await container.exec("pip", [
    "install",
    "--root-user-action",
    "ignore",
    "pandas",
])
await container.writeText(
    "main.py",
    `import pandas as pd
print(pd)
`
)
const res = await container.exec("python", ["main.py"])
if (res.failed) throw new Error("import failed")
