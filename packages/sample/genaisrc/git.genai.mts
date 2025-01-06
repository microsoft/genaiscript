const defaultBranch = await git.defaultBranch()
const branch = await git.branch()
const tag = await git.lastTag()
const branches = await git.listBranches()
console.log({ defaultBranch, branch, branches, tag })

const mods = await git.listFiles("modified", {
    paths: ["**/*.ts"],
    excludedPaths: ["**/genaiscript.d.ts"],
})
console.log({ mods })

const staged = await git.listFiles("staged", {
    paths: ["**/*.ts"],
    excludedPaths: ["**/genaiscript.d.ts"],
})
console.log({ staged })

const files = await git.listFiles("modified-base", {
    paths: ["*/*.ts"],
    excludedPaths: ["**/genaiscript.d.ts"],
})
console.log({ files })

const log = await git.log()
console.log({ log })

for (const commit of log.slice(0, 10)) {
    const diff = await git.diff({ base: commit.sha, llmify: true })
    console.log({ commit: commit.sha, diff: parsers.tokens(diff) + " tokens" })
}

const client = git.client(".")
console.log({ log: await client.log() })

const clone = await git.shallowClone("microsoft/genaiscript")
const cachedClone = await git.shallowClone("microsoft/genaiscript")
console.log({ clone, cachedClone })
if (clone.cwd !== cachedClone.cwd ) throw new Error("Clones should be cached")
