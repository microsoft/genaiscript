// iterate over files and check if they are safe using llama-guard3:8b (https://ollama.com/library/llama-guard3)
const unsafes = []
for (const file of env.files) {
    const { text } = await prompt`${file}`.options({
        model: "ollama:llama-guard3:8b",
        label: file.filename,
        cache: "llama-guard3:8b",
        system: [],
    })
    const safe = /safe/.test(text) && !/unsafe/.test(text)
    if (!safe) {
        console.error(text)
        unsafes.push(file.filename)
    }
}

console.error(`unsafe:\n${unsafes.join("\n")}`)
