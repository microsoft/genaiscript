script({
    title: "Generate TypeScript function documentation using AST insertion",
    accept: ".ts",
    files: "src/fib.ts",
})
const file = env.files[0]
const sg = await host.astGrep()
const { matches, replace, commitEdits } = await sg.search("ts", file.filename, {
    rule: {
        kind: "function_declaration",
        not: {
            precedes: {
                kind: "comment",
                stopBy: "neighbor",
            },
        },
    },
})
for (const match of matches) {
    const res = await runPrompt(
        (_) => {
            _.def("FILE", match.getRoot().root().text())
            _.def("FUNCTION", match.text())
            _.$`Generate a comment that describes the behavior of the function in <FUNCTION>.
            The full source of the file is in <FILE>.`
        },
        { model: "small", responseType: "text", label: match.text() }
    )
    replace(match, `/**\n* ${res.text}\n**/\n${match.text()}`)
}
const modified = await commitEdits()
await workspace.writeFiles(modified)
