system({
    title: "General GitHub information.",
})

const info = await github.info()
if (info?.owner) {
    $`## GitHub information:

- owner: ${info.owner}
- repo: ${info.repo}

`
}
