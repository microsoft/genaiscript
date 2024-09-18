script({
    system: ["system.diff"],
})
const { pattern, glob = "*", transform } = env.vars
console.log(YAML.stringify({ pattern, transform, glob }))
if (!pattern) cancel("pattern is missing")
const patternRx = new RegExp(pattern, "g")

if (!transform) cancel("transform is missing")

const { files } = await workspace.grep(patternRx, glob)
for (const file of files) {
    console.log(file.filename)
    const { content } = await workspace.readText(file.filename)
    const patches = {}
    for (const match of content.matchAll(patternRx)) {
        console.log(`  ${match[0]}`)
        if (patches[match[0]]) continue

        const res = await runPrompt(
            (_) => {
                _.$`
            ## Task
            
            Your task is to transform the MATCH with the following TRANSFORM.
            Return the transformed text.
            
            ## Context
            `
                _.def("MATCHED", match[0])
                _.def("TRANSFORM", transform)
            },
            { label: match[0] }
        )

        if (res.text) patches[match[0]] = res.text
        console.log(`  ${match[0]} -> ${res.text ?? "?"}`)
    }

    const newContent = content.replace(
        patternRx,
        (match) => patches[match] ?? match
    )
    if (content !== newContent)
        await workspace.writeText(file.filename, newContent)
}
