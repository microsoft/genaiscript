import { classify } from "genaiscript/runtime"
import { docify } from "./src/docs.mts"
import { prettier } from "./src/prettier.mts"

script({
    title: "Generate TypeScript function documentation using AST insertion",
    accept: ".ts",
    files: "src/cowsay.ts",
    parameters: {
        diff: {
            type: "boolean",
            default: false,
            description:
                "If true, the script will only process files with changes with respect to main.",
        },
        pretty: {
            type: "boolean",
            default: false,
            description:
                "If true, the script will prettify the files efore analysis.",
        },
        applyEdits: {
            type: "boolean",
            default: false,
            description: "If true, the script will not modify the files.",
        },
    },
})
const { files, output, dbg, vars } = env
const { applyEdits, diff, pretty } = vars

// filter by diff
const diffFiles = diff
    ? DIFF.parse(await git.diff({ base: "main" }))
    : undefined
if (diffFiles)
    dbg(
        `diff files %O`,
        diffFiles.map(({ to, chunks }) => ({
            to,
            chunks: chunks.map(({ newStart, newLines }) => ({
                start: newStart,
                end: newStart + newLines,
            })),
        }))
    )

// find all exported functions without comments
const sg = await host.astGrep()

const stats = []
for (const file of files) {
    dbg(file.filename)
    stats.push({
        filename: file.filename,
        sgMatches: 0,
        diffedMatches: 0,
        matches: 0,
        gen: 0,
        genCost: 0,
        consistent: 0,
        consistentCost: 0,
        edits: 0,
        updated: 0,
    })
    const fileStats = stats.at(-1)
    // normalize spacing
    if (pretty) await prettier(file)

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
    dbg(`sg matches ${matches.length}`)
    fileStats.sgMatches = matches.length
    if (matches?.length && diffFiles?.length) {
        const newMatches = matches.filter((m) => {
            const chunk = DIFF.findChunk(
                m.getRoot().filename(),
                [m.range().start.line, m.range().end.line],
                diffFiles
            )
            dbg(`diff chunk %O`, chunk)
            return chunk
        })
        dbg(`diff filtered ${matches.length} -> ${newMatches.length}`)
        matches = newMatches
        fileStats.diffedMatches = matches.length
    }
    if (!matches.length) {
        continue
    }

    fileStats.matches = matches.length
    dbg(`found ${matches.length} matches`)
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
        fileStats.gen += res.usage?.total || 0
        fileStats.genCost += res.usage?.cost || 0
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
        fileStats.consistent += consistent.usage?.total || 0
        fileStats.consistentCost += consistent.usage?.cost || 0
        const updated = `${docs}\n${match.text()}`
        edits.replace(match, updated)
        fileStats.edits++
    }

    // apply all edits and write to the file
    const [modified] = edits.commit()
    if (!modified) continue
    fileStats.updated = 1

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

output.fence(
    stats.filter((row) =>
        Object.values(row).some((d) => typeof d === "number" && d > 0)
    ),
    "csv"
)
