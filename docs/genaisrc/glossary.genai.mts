// Build a consolidated glossary (max 100 terms) from docs/**/*.md,
// preserving any Markdown links in definitions.
script({
    title: "build-glossary",
    accept: "none",
})
const { output } = env
const docs = await workspace.readText("docs/dist/llms-full.txt")
const chunks = await tokenizers.chunk(docs, {
    model: "openai:gpt-4o-mini",
    chunkSize: 12000,
    chunkOverlap: 1000,
})
const glossaryFilename = "docs/src/content/docs/glossary.json"
const originalGlossary = (await workspace.readJSON(glossaryFilename)) || {}
const entries = {}
for (const chunk of chunks) {
    output.heading(3, `line ${chunk.lineStart}`)

    const res = await runPrompt(
        (ctx) => {
            const fileRef = ctx.def("CHUNK", chunk)
            ctx.$`
## Role

You are a documentation specialist, specializing in indexing and understanding documentation.

## Task
Extract all glossary terms and their definitions from ${fileRef}.
- **Preserve any Markdown-formatted links** (e.g., [text](url)) in definitions exactly as they appear.

## Existing glossary

${YAML.stringify(entries)}.

## Instructions 

DO NOT repeat existing terms that are already in the glossary.
ONLY respond with new terms.
Term names are case sensitive and should be unique.
If there are no new terms, respond with an empty INI block.

## Output

Respond with name=definition pairs, one per line.

term=definition
term2=definition2
term3=definition3
...

Remember DO NOT repeat existing terms that are already in the glossary.
    `
        },
        {
            cache: "glossary",
            model: "small",
            label: `glossarify ${chunk.lineStart}`,
            system: ["system.assistant"],
        }
    )
    const entry = INI.parse(
        res.fences.find((f) => f.language === "ini")?.content ||
            parsers.unfence(res.text, "ini")
    )
    const oldGlossary = structuredClone(entries)
    Object.assign(entries, entry)
    output.diff(YAML.stringify(oldGlossary), YAML.stringify(entries))
    await workspace.writeText(
        path.changeext(glossaryFilename, ".temp.json"),
        JSON.stringify(entries, null, 2)
    )
}

const MAX = 256
const res = await runPrompt(
    (ctx) => {
        const oldTermsRef = ctx.defData("OLD_TERMS", originalGlossary)
        const termsRef = ctx.defData("TERMS", entries)
        ctx.$`
    You may have at most ${MAX} glossary entries.
    From ${termsRef}, consolidate and cap at ${MAX} entries.
    
    - **Preserve any Markdown-formatted links** (e.g., [text](url)) in definitions exactly as they appear.
    - Ensure proper spelling and grammar.

    ## Task:
      1. Merge synonymous or highly related terms. If possible, reuse terms from the existing glossary ${oldTermsRef}.
      2. Refine definitions for clarity and brevity. Fix spelling and grammar.
      3. **Keep all Markdown links** (e.g., [text](url)) intact.
      4. Return at most ${MAX} items.

    ## Output
    Respond in INI format:
    \`\`\`ini   
    term=definition
    term2=definition2
    ...
    \`\`\``
    },
    {
        cache: "glossary",
        systemSafety: false,
    }
)
const glossary = INI.parse(
    res.fences.find((f) => f.language === "ini")?.content ||
        parsers.unfence(res.text, "ini")
)
output.heading(3, "Final glossary")
env.output.fence(glossary, "yaml")
await workspace.writeText(glossaryFilename, JSON.stringify(glossary, null, 2))

await workspace.writeText(
    `docs/src/content/glossary.md`,
    `---
title: Glossary
description: A glossary of terms used in the GenAI project.
keywords: glossary, terms, definitions
sidebar:
    order: 200
---

This glossary provides definitions for terms used in the project.
Each term is linked to its corresponding section in the documentation for easy reference.

> This glossary is auto-generated from the source files.

## Terms

${Object.entries(glossary)
    .sort((l, r) => l[0].toUpperCase().localeCompare(r[0].toUpperCase()))
    .map(([term, definition]) => `- **${term}**: ${definition}`)
    .join("\n")}
`
)
