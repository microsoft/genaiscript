const { output } = env

const sg = await host.astGrep()

const prettier = async (file) => {
    // format
    const res = await host.exec("prettier", [
        "--write",
        "--plugin=prettier-plugin-curly",
        file.filename,
    ])
    if (res.exitCode) output.fence(res.stderr)
    return res
}

for (const file of env.files) {
    await prettier(file)
    const { matches } = await sg.search(
        "ts",
        file.filename,
        YAML`
rule:
    kind: expression_statement
    not:
      has:
        pattern: dbg($ARGS)
    inside:
        any:
          - kind: statement_block
          - kind: else_clause
`
    )

    const edits = sg.changeset()
    const logs: Record<string, SgNode> = {}
    for (const match of matches) {
        const expr = match.find({ rule: { kind: "expression_statement" } })
        output.fence(expr.text(), "json")
        const msg = `DEBUG_MSG_${Object.keys(logs).length}`
        logs[msg] = expr
        edits.replace(expr, `dbg("<${msg}>")\n${expr.text()}`)
    }
    const updated = await edits.commit()
    output.diff(file, updated[0])

    const res = await runPrompt((_) => {
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

        \`\`\`txt
        DEBUG_MS_0: \`<message>\`
        DEBUG_MSG_2: \`<message>\`
        \`\`\`

        ## Guidance

        - You can use the content of the file to generate the messages.
        - If a message is inside an if statement, your message should explain the selected branch.
        - variables should be in scope.
        - dbg uses the printf style formatting. The formatters are: '%O' = Pretty-print an Object on multiple lines, '%o'	Pretty-print an Object all on a single line, '%s'	String, '%d'	Number (both integer and float).

            dbg('foo: %s', foo) // foo: 42
            dbg('foo: %O', foo) // foo: { bar: 42, baz: 43 }

        `
    })

    output.fence(res.text, "ini")
    const rx = /^(?<id>DEBUG_MSG_\d+): \`(?<msg>.*)\`$/gm
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
        logEdits.replace(expr, `dbg("${msg}")\n${expr.text()}`)
    }
    const updatedLogs = await logEdits.commit()
    output.diff(file, updatedLogs[0])
}
