import { fileTree } from "genaiscript/runtime"

script({ model: "small", tools: "fs_read_file" })

console.log(await fileTree("src/**"))
console.log(
    await fileTree("src/**/*.md", {
        frontmatter: ["title", "description"],
    })
)

def("FILES", await fileTree("**/*.md*", { frontmatter: ["title"] }))
$`Summarize the markdown files in the project.`
