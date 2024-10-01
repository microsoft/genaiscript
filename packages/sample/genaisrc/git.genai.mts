const defaultBranch = await git.defaultBranch()
console.log({ defaultBranch })

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

const branch = await git.listFiles("base", {
    paths: ["*/*.ts"],
    excludedPaths: ["**/genaiscript.d.ts"],
})
console.log({ branch })
