import { readFile, readdir, writeFile } from "fs/promises"

async function main() {
    const files = [
        "./dist/llms-full.txt",
        "./dist/llms-small.txt",
        "./dist/llms.txt",
        ...(await readdir("./dist/_llms-txt"))
            .filter((f) => f.endsWith(".txt"))
            .map((f) => `./dist/_llms-txt/${f}`),
    ]
    for (const file of files) {
        const text = await readFile(file, "utf-8")
        const newText = text.replace(
            /^\!\[\]\(<data:image\/svg\+xml,.*$/gm,
            "<!-- mermaid diagram -->"
        )
        if (text !== newText) {
            console.log(`Updating ${file}`)
            await writeFile(file, newText, "utf-8")
        }
    }
}
main()
