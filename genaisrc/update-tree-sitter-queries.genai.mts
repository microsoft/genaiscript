import { Octokit } from "octokit"

const files: Record<string, string> = {}
const downloadScm = async (repo: string, name: string) => {
    const repoName = repo.replace(/^tree-sitter-/, "")
    try {
        const res = await client.rest.repos.getContent({
            owner: "tree-sitter",
            repo,
            path: `queries/${name}.scm`,
            mediaType: { format: "raw" },
        })
        if (res.status === 200) {
            // download and stream content to a file
            await workspace.writeText(
                `packages/core/src/queries/${repoName}/${name}.scm`,
                res.data
            )
            files[`${repoName}/${name}`] = res.data
        }
    } catch (e) {}
}

const { client } = await github.client()

const repos = await client.rest.repos.listForOrg({
    org: "tree-sitter",
})
const tsRepos = repos.data.filter((repo) =>
    repo.name.startsWith("tree-sitter-")
)
console.log(`Found ${tsRepos.length} tree-sitter repos`)
for (const repo of tsRepos) {
    console.log(`Updating queries for ${repo.name}`)
    await downloadScm(repo.name, "tags")
}

await workspace.writeText(
    "packages/core/src/treesitterqueries.json",
    JSON.stringify(files, null, 2)
)
