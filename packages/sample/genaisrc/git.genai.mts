const mods = await git.findModifiedFiles("modified", {
    paths: ["**/*.ts"],
    excludedPaths: ["**/genaiscript.d.ts"],
})
console.log({ mods })

const staged = await git.findModifiedFiles("staged", {
    paths: ["**/*.ts"],
    excludedPaths: ["**/genaiscript.d.ts"],
})
console.log({ staged })

const branch = await git.findModifiedFiles("branch", {
    paths: ["*/*.ts"],
    excludedPaths: ["**/genaiscript.d.ts"],
})
console.log({ branch })
