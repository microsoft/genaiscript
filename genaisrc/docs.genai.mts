import { classify } from "genaiscript/runtime"

script({
    title: "Generate TypeScript function documentation using AST insertion",
    group: "dev",
    description: `
## Docs!

This script generates and updates TypeScript function using an AST/LLM hybrid approach.
It uses ast-grep to look for undocumented and documented functions,
then uses a combination of LLM, and LLM-as-a-judge to generate and validate the documentation.
It also uses prettier to format the code before and after the generation.

By default, 

- no edits are applied on disk. It is recommended to 
run this script with \`--vars 'applyEdits=true'\` to apply the edits.
- if a diff is available, it will only process the files with changes.
    
    `,
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
                "If true, the script will prettify the files before analysis.",
        },
        applyEdits: {
            type: "boolean",
            default: false,
            description: "If true, the script will modify the files.",
        },
        missing: {
            type: "boolean",
            default: true,
            description: "Generate missing docs.",
        },
        update: {
            type: "boolean",
            default: true,
            description: "Update existing docs.",
        },
        maxFiles: {
            type: "integer",
            description: "Maximum number of files to process.",
        },
    },
})
const { output, dbg, vars } = env
let { files } = env
const { applyEdits, diff, pretty, missing, update, maxFiles } = vars

dbg({ applyEdits, diff, pretty, missing, update, maxFiles })

if (!missing && !update) cancel(`not generating or updating docs, exiting...`)

if (!applyEdits)
    output.warn(
        `edit not applied, use --vars 'applyEdits=true' to apply the edits`
    )

// filter by diff
const gitDiff = diff ? await git.diff({ base: "dev" }) : undefined
dbg(`diff: %s`, gitDiff)
const diffFiles = gitDiff ? DIFF.parse(gitDiff) : undefined
if (diff && !diffFiles?.length) cancel(`no diff files found, exiting...`)
if (diffFiles?.length) {
    dbg(`diff files: ${diffFiles.map((f) => f.to)}`)
    files = files.filter(({ filename }) =>
        diffFiles.some((f) => path.resolve(f.to) === path.resolve(filename))
    )
    dbg(`diff filtered files: ${files.length}`)
}
if (!files.length) cancel(`no files to process, exiting...`)

if (maxFiles && files.length > maxFiles) {
    dbg(`random slicing files to ${maxFiles}`)
    files = parsers.tidyData(files, {
        sliceSample: maxFiles,
    }) as WorkspaceFile[]
}

const sg = await host.astGrep()
const stats = []
for (const file of files) {
    console.debug(file.filename)
    // normalize spacing
    if (pretty) await prettier(file)

    // generate updated docs
    if (update) {
        stats.push({
            filename: file.filename,
            kind: "update",
            gen: 0,
            genCost: 0,
            judge: 0,
            judgeCost: 0,
            edits: 0,
            updated: 0,
        })
        await updateDocs(file, stats.at(-1))
    }

    // generate missing docs
    if (missing) {
        stats.push({
            filename: file.filename,
            kind: "new",
            gen: 0,
            genCost: 0,
            judge: 0,
            judgeCost: 0,
            edits: 0,
            updated: 0,
            nits: 0,
        })
        await generateDocs(file, stats.at(-1))
    }
}

if (stats.length)
    output.table(
        stats.filter((row) =>
            Object.values(row).some((d) => typeof d === "number" && d > 0)
        )
    )

async function generateDocs(file: WorkspaceFile, fileStats: any) {
    const { matches: missingDocs } = await sg.search(
        "ts",
        file.filename,
        {
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
        },
        { diff: gitDiff, applyGitIgnore: false }
    )
    dbg(`found ${missingDocs.length} missing docs`)
    const edits = sg.changeset()
    // for each match, generate a docstring for functions not documented
    for (const missingDoc of missingDocs) {
        const res = await runPrompt(
            (_) => {
                _.def("FILE", missingDoc.getRoot().root().text())
                _.def("FUNCTION", missingDoc.text())
                // this needs more eval-ing
                _.$`Generate a TypeScript function documentation for <FUNCTION>.
                - Make sure parameters are documented.
                - Be concise. Use technical tone.
                - do NOT include types, this is for TypeScript.
                - Use docstring syntax. do not wrap in markdown code section.
    
                The full source of the file is in <FILE> for reference.`
            },
            {
                model: "large",
                responseType: "text",
                label: missingDoc.text()?.slice(0, 20) + "...",
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
        const judge = await classify(
            (_) => {
                _.def("FUNCTION", missingDoc.text())
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
        fileStats.judge += judge.usage?.total || 0
        fileStats.judgeCost += judge.usage?.cost || 0
        if (judge.label !== "ok") {
            output.warn(judge.label)
            output.fence(judge.answer)
            continue
        }
        const updated = `${docs}\n${missingDoc.text()}`
        edits.replace(missingDoc, updated)
        fileStats.edits++
        fileStats.nits++
    }

    // apply all edits and write to the file
    const modifiedFiles = edits.commit()
    if (!modifiedFiles?.length) {
        dbg("no edits to apply")
        return
    }
    fileStats.updated = 1
    if (applyEdits) {
        await workspace.writeFiles(modifiedFiles)
        await prettier(file)
    } else {
        output.diff(file, modifiedFiles[0])
    }
}

async function updateDocs(file: WorkspaceFile, fileStats: any) {
    const { matches } = await sg.search(
        "ts",
        file.filename,
        YAML`
rule: 
  kind: "export_statement"
  follows: 
    kind: "comment"
    stopBy: neighbor
  has:
      kind: "function_declaration"
`,
        { diff: gitDiff, applyGitIgnore: false }
    )
    dbg(`found ${matches.length} docs to update`)
    const edits = sg.changeset()
    // for each match, generate a docstring for functions not documented
    for (const match of matches) {
        const comment = match.prev()

        const res = await runPrompt(
            (_) => {
                _.def("FILE", match.getRoot().root().text(), { flex: 1 })
                _.def("DOCSTRING", comment.text(), { flex: 10 })
                _.def("FUNCTION", match.text(), { flex: 10 })
                // this needs more eval-ing
                _.$`Update the TypeScript docstring <DOCSTRING> to match the code in function <FUNCTION>.
                - If the docstring is up to date, return /NO/. It's ok to leave it as is.
                - do not rephrase an existing sentence if it is correct.
                - Make sure parameters are documented.
                - do NOT include types, this is for TypeScript.
                - Use docstring syntax. do not wrap in markdown code section.
                - Minimize updates to the existing docstring.
                
                The full source of the file is in <FILE> for reference.
                The source of the function is in <FUNCTION>.
                The current docstring is <DOCSTRING>.

                docstring:

                /**
                 * description
                 * @param param1 - description
                 * @param param2 - description
                 * @returns description
                 */
                `
            },
            {
                model: "large",
                responseType: "text",
                flexTokens: 12000,
                label: match.text()?.slice(0, 20) + "...",
                temperature: 0.2,
                systemSafety: false,
                system: ["system.technical", "system.typescript"],
            }
        )
        fileStats.gen += res.usage?.total || 0
        fileStats.genCost += res.usage?.cost || 0
        // if generation is successful, insert the docs
        if (res.error) {
            output.warn(res.error.message)
            continue
        }

        if (res.text.includes("/NO/")) continue

        const docs = docify(res.text.trim())

        // ask LLM if change is worth it
        const judge = await classify(
            (_) => {
                _.def("FUNCTION", match.text())
                _.def("ORIGINAL_DOCS", comment.text())
                _.def("NEW_DOCS", docs)
                _.$`An LLM generated an updated docstring <NEW_DOCS> for function <FUNCTION>. The original docstring is <ORIGINAL_DOCS>.`
            },
            {
                APPLY: "The <NEW_DOCS> is a significant improvement to <ORIGINAL_DOCS>.",
                NIT: "The <NEW_DOCS> contains nitpicks (minor adjustments) to <ORIGINAL_DOCS>.",
            },
            {
                model: "large",
                responseType: "text",
                temperature: 0.2,
                systemSafety: false,
                system: ["system.technical", "system.typescript"],
            }
        )

        fileStats.judge += judge.usage?.total || 0
        fileStats.judgeCost += judge.usage?.cost || 0
        if (judge.label === "NIT") {
            output.warn("LLM suggests minor adjustments, skipping")
            continue
        }
        edits.replace(comment, docs)
        fileStats.edits++
    }

    // apply all edits and write to the file
    const modifiedFiles = edits.commit()
    if (!modifiedFiles?.length) {
        dbg("no edits to apply")
        return
    }
    fileStats.updated = 1
    if (applyEdits) {
        await workspace.writeFiles(modifiedFiles)
        await prettier(file)
    } else {
        output.diff(file, modifiedFiles[0])
    }
}

function docify(docs: string) {
    docs = parsers.unfence(docs, "*")
    if (!/^\/\*\*.*.*\*\/$/s.test(docs))
        docs = `/**\n* ${docs.split(/\r?\n/g).join("\n* ")}\n*/`
    return docs.replace(/\n+$/, "")
}

async function prettier(file: WorkspaceFile, options?: { curly?: boolean }) {
    dbg(file.filename)
    const args = ["--write"]
    if (options?.curly) args.push("--plugin=prettier-plugin-curly")
    // format
    const res = await host.exec("prettier", [...args, file.filename])
    if (res.exitCode) {
        dbg(`error: %d\n%s`, res.exitCode, res.stderr)
        throw new Error(`${res.stdout} (${res.exitCode})`)
    }
}
