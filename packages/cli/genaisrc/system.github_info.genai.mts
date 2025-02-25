system({
    title: "General GitHub information.",
})

const info = await github.info()
if (info?.owner) {
    const { owner, repo, baseUrl } = info

    $`## GitHub
    - current github repository: ${owner}/${repo}`
    if (baseUrl) $`- current github base url: ${baseUrl}`
}
