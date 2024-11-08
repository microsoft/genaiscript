script({
    title: "Search and transform",
    description:
        "Search for a pattern in files and apply a LLM transformation the match",
    parameters: {
        glob: {
            type: "string",
            description: "The glob pattern to filter files",
        },
        pattern: {
            type: "string",
            description: "The text pattern (regular expression) to search for",
        },
        transform: {
            type: "string",
            description: "The LLM transformation to apply to the match",
        },
    },
})

let { pattern, glob, transform } = env.vars
if (!glob)
    glob =
        (await host.input(
            "Enter the glob pattern to filter files (default: *)"
        )) || "*"
if (!pattern)
    pattern = await host.input(
        "Enter the pattern to search for (regular expression)"
    )
if (!pattern) cancel("pattern is missing")
const patternRx = new RegExp(pattern, "g")

if (!transform)
    transform = await host.input(
        "Enter the LLM transformation to apply to the match"
    )
if (!transform) cancel("transform is missing")

const { files } = await workspace.grep(patternRx, { glob })
// cached computed transformations
const patches = {}
for (const file of files) {
    console.log(file.filename)
    const { content } = await workspace.readText(file.filename)

    // skip binary files
    if (!content) continue

    // compute transforms
    for (const match of content.matchAll(patternRx)) {
        console.log(`  ${match[0]}`)
        if (patches[match[0]]) continue

        const res = await runPrompt(
            (_) => {
                _.$`
            ## Task
            
            Your task is to transform the MATCH with the following TRANSFORM.
            Return the transformed text.
            - do NOT add enclosing quotes.
            
            ## Context
            `
                _.def("MATCHED", match[0])
                _.def("TRANSFORM", transform, {
                    detectPromptInjection: "available",
                })
            },
            {
                label: match[0],
                system: [
                    "system.assistant",
                    "system.safety_jailbreak",
                    "system.safety_harmful_content",
                ],
                cache: "search-and-transform",
            }
        )

        const transformed = res.fences?.[0].content ?? res.text
        if (transformed) patches[match[0]] = transformed
        console.log(`  ${match[0]} -> ${transformed ?? "?"}`)
    }

    // apply transforms
    const newContent = content.replace(
        patternRx,
        (match) => patches[match] ?? match
    )

    // save results if file content is modified
    if (content !== newContent)
        await workspace.writeText(file.filename, newContent)
}
