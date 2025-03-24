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
const sg = await host.astGrep()
// find all exported functions without comments
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
for (const match of matches) {
    const res = await runPrompt(
        (_) => {
            _.def("FILE", match.getRoot().root().text())
            _.def("FUNCTION", match.text())
            _.$`Generate a documentation summary that describes the behavior of the function in <FUNCTION>.
            - Be short and descriptive. Use technical tone.
            The full source of the file is in <FILE>.`
        },
        { model: "small", responseType: "text", label: match.text() }
    )
    replace(match, `/**\n* ${res.text}\n**/\n${match.text()}`)
}
const modified = await commitEdits()
output.diff(file, modified[0])
if (applyEdits) await workspace.writeFiles(modified)
else
    output.warn(
        `edit not applied, use --vars 'applyEdits=true' to apply the edits`
    )
