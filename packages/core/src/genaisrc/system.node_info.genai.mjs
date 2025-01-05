system({
    title: "Information about the current project",
})

const { stdout: nodeVersion } = await host.exec("node", ["--version"])
const { stdout: npmVersion } = await host.exec("npm", ["--version"])
const { name, version } = (await workspace.readJSON("package.json")) || {}
if (nodeVersion) $`- node.js v${nodeVersion}`
if (npmVersion) $`- npm v${npmVersion}`
if (name) $`- package ${name} v${version || ""}`
