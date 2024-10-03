system({
    title: "General GitHub information.",
})

const info = await github.info()
if (info?.owner) {
    const { auth, ...rest } = info
    $`## GitHub information:

${YAML.stringify(rest)}
`
}
