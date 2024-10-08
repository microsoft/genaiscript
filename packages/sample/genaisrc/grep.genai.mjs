script({
    title: "grep search",
    model: "gpt-4o-mini",
    tests: {},
})

let res

res = await workspace.grep(/deftool/i)
if (!res.files.length) throw new Error("No files found.")

res = await workspace.grep(/deftool/i, {
    path: "genaisrc",
    glob: "*.genai.*",
})
if (!res.files.length) throw new Error("No files found.")

res = await workspace.grep(/deftool/i, {
    glob: "*.genai.*",
})
if (!res.files.length) throw new Error("No files found.")

res = await workspace.grep(/deftool/i, "**/*.genai.*")
if (!res.files.length) throw new Error("No files found.")
