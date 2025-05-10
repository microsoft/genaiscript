// Build a consolidated glossary (max 100 terms) from docs/**/*.md,
// preserving any Markdown links in definitions.
script({
    title: "build-glossary",
    files: ["docs/**/*.md*"],
    accept: ".md,.mdx",
    parameters: {
        n: {
            type: "integer",
            description: "Max number of glossary entries",
        },
    },
})
const { output } = env
const files = env.files.slice(0, env.vars.n)
const glossaryFilename = "docs/src/docs/glossary.json"
const originalGlossary = (await workspace.readJSON(glossaryFilename)) || {}
const entries = {}
for (const file of files.filter(
    ({ filename }) => !/glossary\.md/.test(filename)
)) {
    output.heading(3, file.filename)

    const res = await runPrompt(
        (ctx) => {
            const glossaryRef = ctx.defData("GLOSSARY", entries)
            const fileRef = ctx.def("FILE", file)
            ctx.$`## Task
      Extract all glossary terms and their definitions from ${fileRef}.
      **Preserve any Markdown-formatted links** (e.g., [text](url)) in definitions exactly as they appear.

      ## Existing glossary

      You may skip terms already defined in the glossary ${glossaryRef}.

      ## Output

      Respond with new or update existing terms in the INI format:
      \`\`\`ini   
      term=definition
      term2=definition2
      ...
      \`\`\`

      DO NOT repeat existing terms that are already in the glossary.
      DO NOT modify existing terms unless absolutely necessary.
    `
        },
        {
            cache: "glossary",
            model: "small",
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
    **Preserve any Markdown-formatted links** (e.g., [text](url)) in definitions exactly as they appear.

    ## Task:
      1. Merge synonymous or highly related terms. If possible, reuse terms from the existing glossary ${oldTermsRef}.
      2. Refine definitions for clarity and brevity.
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
