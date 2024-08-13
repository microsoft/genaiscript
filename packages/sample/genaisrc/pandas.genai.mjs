const container = await host.container({ image: "python:3", networkEnabled: true })
await container.exec("pip", ["install", "--root-user-action", "ignore", "pandas"])
await container.writeText("main.py", `import pandas as pd
print(pd)
`)
const res = await container.exec('python', ["main.py"])
console.log(YAML.stringify(res))