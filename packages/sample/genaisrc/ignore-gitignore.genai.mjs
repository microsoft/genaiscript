script({
    ignoreGitIgnore: true,
    files: ".genaiscript/.gitignore",
    tests: {},
    model: "echo",
    group: "commit",
})

console.log(env.files)
if (!env.files.length) throw Error("gitignore filter not applied")
