script({
    ignoreGitIgnore: true,
    files: ".genaiscript/.gitignore",
    tests: {},
    model: "echo",
})

console.log(env.files)
if (!env.files.length) throw Error("gitignore filter not applied")
