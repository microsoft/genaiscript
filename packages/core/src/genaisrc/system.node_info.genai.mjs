system({
    title: "Information about the current project",
})

export default async function main(ctx) {
    const { stdout: nodeVersion } = await host.exec("node", ["--version"])
    const { stdout: npmVersion } = await host.exec("npm", ["--version"])
    const { name, version } = (await workspace.readJSON("package.json")) || {}
    if (nodeVersion) ctx.$`- node.js v${nodeVersion}`
    if (npmVersion) ctx.$`- npm v${npmVersion}`
    if (name) ctx.$`- package ${name} v${version || ""}`
}
