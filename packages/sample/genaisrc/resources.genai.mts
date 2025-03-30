import { randomBytes } from "node:crypto"

script({
    files: ["src/rag/*.md", "src/*.jpg"],
    group: "mcp",
})
let id = await host.publishResource("This is just a string")
console.log(id)

id = await host.publishResource(randomBytes(32))
console.log(id)

id = await host.publishResource({
    filename: "https://microsoft.github.io/genaiscript/llms-full.txt",
})
console.log(id)

for (const file of env.files) {
    id = await host.publishResource(file)
    console.log(id)
}
