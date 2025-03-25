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

// find all exported functions with comments
const sg = await host.astGrep()
const { matches, replace, commitEdits } = await sg.search("ts", file.filename, {
    rule: {
        kind: "export_statement",
        follows: {
            kind: "comment",
            stopBy: "neighbor",
        },
        has: {
            kind: "function_declaration",
        },
    },
})

// for each match, generate a docstring for functions not documented
for (const match of matches) {
    const comment = match.prev()

    const res = await runPrompt(
        (_) => {
            _.def("FILE", match.getRoot().root().text(), { flex: 1 })
            _.def("DOCSTRING", comment.text(), { flex: 10 })
            _.def("FUNCTION", match.text(), { flex: 10 })
            // this needs more eval-ing
            _.$`Update the docstring <DOCSTRING> of function <FUNCTION>.
            - If the docstring is up to date, return /NOP/.
            - do not rephrase an existing sentence if it is correct.
            - Make sure parameters are documented.
            - Be concise. Use technical tone.
            - do NOT include types, this is for TypeScript.
            - Use docstring syntax. do not wrap in markdown code section.
            - Minimize updates to the existing docstring.
            
            The full source of the file is in <FILE> for reference.
            The source of the function is in <FUNCTION>.
            The current docstring is <DOCSTRING>.
            `
        },
        {
            model: "large",
            responseType: "text",
            flexTokens: 12000,
            label: match.child(0).text(),
            temperature: 0.2
        }
    )
    // if generation is successful, insert the docs
    if (res.error) {
        output.warn(res.error.message)
        continue
    }

    if (res.text.includes("/NOP/")) continue

    const docs = docify(
        parsers.unfence(res.text.trim(), ["", "typescript", "ts"])
    )
    replace(comment, docs)
}

// apply all edits and write to the file
const modified = await commitEdits()
if (applyEdits) {
    await workspace.writeFiles(modified)
} else if (modified.length) {
    output.diff(file, modified[0])
    output.warn(
        `edit not applied, use --vars 'applyEdits=true' to apply the edits`
    )
}

// normalizes the docstring in case the LLM decides not to generate proper comments
function docify(docs: string) {
    if (!/^\/\*\*.*.*\*\/$/s.test(docs))
        docs = `/**\n* ${docs.split(/\r?\n/g).join("\n* ")}\n*/`
    return docs.replace(/\n+$/, "")
}
