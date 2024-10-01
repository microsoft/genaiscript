const defaultBranch = await git.defaultBranch()
const branch = await git.branch()
const branches = await git.listBranches()
console.log({ defaultBranch, branch, branches })

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
