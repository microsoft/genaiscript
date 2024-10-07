script({
    title: "grep search",
    model: "gpt-4o-mini",
    tests: {},
})

let res

res = await workspace.grep(/defdata/i)
console.log(YAML.stringify(res.matches))
if (!res.files.length) throw new Error("No files found.")

res = await workspace.grep(/defdata/i, {
    glob: "**/*.genai.{js,mjs}",
})
console.log(YAML.stringify(res.matches))
if (!res.files.length) throw new Error("No files found.")

res = await workspace.grep(/defdata/i, {
    path: "docs",
    glob: "*.{md,mdx}",
})
console.log(YAML.stringify(res.matches))
if (!res.files.length) throw new Error("No files found.")
