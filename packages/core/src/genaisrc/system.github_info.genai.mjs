system({
    title: "General GitHub information.",
})

export default async function main(ctx) {
    const info = await github.info()
    if (info?.owner) {
        const { owner, repo, baseUrl } = info
        ctx.$`- current github repository: ${owner}/${repo}`
        if (baseUrl) ctx.$`- current github base url: ${baseUrl}`
    }
}
