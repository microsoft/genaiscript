import { prettier } from "../../../genaisrc/src/prettier.mts"
import { astGrep } from "@genaiscript/plugin-ast-grep"

script({
    title: "Add debug logging statements to if statements",
    description: "Add debug logging statements to if statements",
    group: "dev",
    parameters: {
        applyEdits: {
            type: "boolean",
            default: true,
            description: "If true, the script will not modify the files.",
        },
    },
})

const { output, dbg, vars } = env
const { applyEdits } = vars as {
    applyEdits?: boolean
}

const sg = await astGrep()
for (const file of env.files) {
    dbg(file.filename)

    const ns = `genaiscript:${path.changeext(path.basename(file.filename), "")}`
    // add import
    const { matches: imports } = await sg.search(
        "ts",
        file.filename,
        "const dbg = debug($NAMESPACE)"
    )
    if (imports.length === 0) {
        file.content = `import debug from "debug";
        const dbg = debug("${ns}");
        ${file.content}`
        await workspace.writeFiles([file])
    }

    await prettier(file, { curly: true })
    const { matches } = await sg.search(
        "ts",
        file.filename,
        YAML`
rule:
    kind: statement_block
    not:
      has:
        pattern: dbg($ARGS)
    inside:
        any:
            - kind: if_statement
            - kind: else_clause
`
    )
    dbg("found %d matches", matches.length)
    const edits = sg.changeset()
    const logs: Record<string, SgNode> = {}
    for (const match of matches) {
        const expr = match.child(1)
        dbg(`expr: %s %s`, expr.kind(), expr.text())
        const msg = `DEBUG_MSG_${Object.keys(logs).length}`
        logs[msg] = expr
        edits.replace(expr, `dbg("<${msg}>")\n${expr.text()}`)
    }
    const updated = await edits.commit()
    output.diff(file, updated[0])

    const res = await runPrompt(
        (_) => {
            const vfile = _.def("FILE", updated)
            _.$`## Task

        Your task is to generate debug log messages in the TypeScript code in file ${vfile}.

        ## Input source code

        Implement messages for each placeholder which looks like this '<DEBUG_MSG_0>':
        \`\`\`ts
        dbg(<DEBUG_MSG_0>)
        ...

        dbg(<DEBUG_MSG_2>)
        ...
        \`\`\`

        ## Output

        You should only output the log messages, one per line with the message identifier
        and interesting context variables if needed:

        DEBUG_MS_0: "message"
        DEBUG_MSG_2: "message %s", arg1

        ## Guidance

        - You can use the content of the file to generate the messages.
        - The debug messages are already prepended with '${ns}'. Do not include it in your output.
        - Message should be clear and concise, in technical English.
        - If a message is inside an if statement, your message should explain the selected branch.
        - dbg uses the printf style formatting. The formatters for additional arguments are: '%O' = Pretty-print an Object on multiple lines, '%o'	Pretty-print an Object all on a single line, '%s'	String, '%d'	Number (both integer and float).

            dbg("foo: %s", foo) // foo: 42
            dbg("foo: %O", foo) // foo: { bar: 42, baz: 43 }
        - variables should be in scope.
        - Do not use the word 'logging' or 'debug' in the message, just do it.
        - Do not capitalize the first letter of the message.

        `
        },
        { systemSafety: false, system: [], responseType: "text" }
    )

    output.fence(res.text, "ini")
    const rx = /^(?<id>DEBUG_MSG_\d+): (?<msg>.*)$/gm
    const updates = res.text.matchAll(rx)
    const logEdits = sg.changeset()
    for (const update of updates) {
        const id = update.groups.id
        const msg = update.groups.msg
        const expr = logs[id]
        if (!expr) {
            output.warn(`missing ${id} in ${file.filename}`)
            continue
        }
        logEdits.replace(expr, `dbg(${msg});\n${expr.text()}`)
    }
    const updatedLogs = await logEdits.commit()
    if (applyEdits) {
        await workspace.writeFiles(updatedLogs)
        await prettier(file)
        // compile and repair
    } else output.diff(file, updatedLogs[0])
}
