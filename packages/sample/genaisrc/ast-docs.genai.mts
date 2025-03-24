script({
    title: "Generate TypeScript function documentation using AST insertion",
    accept: ".ts",
    files: "src/cowsay.ts",
    parameters: {
        applyEdits: {
            type: "boolean",
            default: false,
            description: "If true, the script will not modify the files.",
        },
    },
})
const { output } = env
const { applyEdits } = env.vars
const file = env.files[0]
// find all exported functions without comments
const sg = await host.astGrep()
const { matches, replace, commitEdits } = await sg.search("ts", file.filename, {
    rule: {
        kind: "export_statement",
        has: {
            kind: "function_declaration",
            not: {
                precedes: {
                    kind: "comment",
                    stopBy: "neighbor",
                },
            },
        },
    },
})

// for each match, generate a docstring
for (const match of matches) {
    const res = await runPrompt(
        (_) => {
            _.def("FILE", match.getRoot().root().text())
            _.def("FUNCTION", match.text())
            _.$`Generate a function documentation for <FUNCTION>.
            - Be concise. Use technical tone.
            - do NOT include types, this is for TypeScript.
            - Use docstring syntax.
            The full source of the file is in <FILE> for reference.`
        },
        { model: "small", responseType: "text", label: match.text() }
    )
    // if generation is successful, insert the docs
    if (res.error) {
        output.warn(res.error.message)
        continue
    }
    const docs = docify(res.text.trim())
    const updated = `${docs}\n${match.text()}`
    replace(match, updated)
}
const modified = await commitEdits()
if (applyEdits) {
    await workspace.writeFiles(modified)
} else {
    output.diff(file, modified[0])
    output.warn(
        `edit not applied, use --vars 'applyEdits=true' to apply the edits`
    )
}

function docify(docs: string) {
    if (!/^\/\*\*.*.*\*\/$/s.test(docs))
        docs = `/**\n* ${docs.split(/\r?\n/g).join("\n* ")}\n*/`
    return docs.replace(/\n+$/, "")
}
