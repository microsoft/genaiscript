script({ model: "echo", group: "commit" })

const __filename = path.resolveFileURL(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("Current file path:", __filename)
console.log("Current directory:", __dirname)
const langgraph = await workspace.readText(path.join(__dirname, "langgraph.md"))

console.log(`langgraph.md content: ${langgraph.content.length}`)
if (!langgraph) throw new Error("Failed to read langgraph.md")
