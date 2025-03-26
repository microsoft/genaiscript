import { classify } from "genaiscript/runtime"
import { docify } from "./src/docs.mts"
import { prettier } from "./src/prettier.mts"

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

// filter by diff
const diffFiles = DIFF.parse(await git.diff({ base: "main" }))

for (const file of env.files) {
    // normalize spacing
    await prettier(file)

    // find all exported functions without comments
    const sg = await host.astGrep()

    let { matches } = await sg.search("ts", file.filename, {
        rule: {
            kind: "export_statement",
            not: {
                follows: {
                    kind: "comment",
                    stopBy: "neighbor",
                },
            },
            has: {
                kind: "function_declaration",
            },
        },
    })
    if (diffFiles?.length) {
        matches = matches.filter((m) =>
            DIFF.findChunk(
                m.getRoot().filename(),
                [m.range().start.line, m.range().end.line],
                diffFiles
            )
        )
    }
    if (!matches.length) continue

    const edits = sg.changeset()
    // for each match, generate a docstring for functions not documented
    for (const match of matches) {
        const res = await runPrompt(
            (_) => {
                _.def("FILE", match.getRoot().root().text())
                _.def("FUNCTION", match.text())
                // this needs more eval-ing
                _.$`Generate a function documentation for <FUNCTION>.
            - Make sure parameters are documented.
            - Be concise. Use technical tone.
            - do NOT include types, this is for TypeScript.
            - Use docstring syntax. do not wrap in markdown code section.

            The full source of the file is in <FILE> for reference.`
            },
            {
                model: "large",
                responseType: "text",
                label: match.text()?.slice(0, 20),
            }
        )
        // if generation is successful, insert the docs
        if (res.error) {
            output.warn(res.error.message)
            continue
        }
        const docs = docify(res.text.trim())

        // sanity check
        const consistent = await classify(
            (_) => {
                _.def("FUNCTION", match.text())
                _.def("DOCS", docs)
            },
            {
                ok: "The content in <DOCS> is an accurate documentation for the code in <FUNCTION>.",
                err: "The content in <DOCS> does not match with the code in <FUNCTION>.",
            },
            {
                model: "small",
                responseType: "text",
                temperature: 0.2,
                systemSafety: false,
                system: ["system.technical", "system.typescript"],
            }
        )

        if (consistent.label !== "ok") {
            output.warn(consistent.label)
            output.fence(consistent.answer)
            continue
        }

        const updated = `${docs}\n${match.text()}`
        edits.replace(match, updated)
    }

    // apply all edits and write to the file
    const [modified] = edits.commitEdits()
    if (!modified) continue

    if (applyEdits) {
        await workspace.writeFiles(modified)
        await prettier(file)
    } else {
        output.diff(file, modified)
        output.warn(
            `edit not applied, use --vars 'applyEdits=true' to apply the edits`
        )
    }
}
