script({
    accept: ".ts",
    files: "src/fib.ts",
})

const { output, vars, generator } = env
const { runPrompt, $ } = generator

const compile = async (file) => {
    const tsc = await host.exec(
        "yarn",
        ["tsc", "--noEmit", "--pretty", "false", "-p", "src"],
        {
            cwd: path.dirname(path.dirname(file.filename)),
        }
    )
    if (tsc.exitCode) output.fence(tsc.stderr)
    return tsc
}

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

async function debugify(file: WorkspaceFile) {
    output.heading(2, file.filename)
    await prettier(file)
    file = await workspace.readText(file.filename)

    const tsc = await compile(file)
    if (tsc.exitCode) {
        output.warn("file does not compile")
        return
    }

    const imports = `import debug from "debug"
const dbg = debug("genai:${path.basename(file.filename).replace(/\..*$/, "")}")\n
`
    if (!file.content.includes(imports)) file.content = imports + file.content

    const res = await runPrompt(
        (ctx) => {
            const filen = ctx.def("FILE", file, { lineNumbers: true })
            ctx.$`Your task is to instrument the TypeScript code in file ${filen} with debug logging. Be concise, no explanations.

## Add debug logs

You are using the 'debug' npm package for logging (https://www.npmjs.com/package/debug).
Add debug log **statement** before function call
or entering an if statement.

\`\`\`ts
dbg('message')
\`\`\`

You should generate log statement that will be injected into the code. The existing line of code will
be moved down.

original code:
\`\`\`ts
function fib(n: number): number {
    if (n <= 1) return n
    return fib(n - 1) + fib(n - 2)
}
\`\`\`

After adding debug logs:
\`\`\`ts
function fib(n: number): number {
    dbg('entering fib with n = \${n}')
    if (n <= 1) return n
    dbg('returning fib(n - 1) + fib(n - 2)')
    return fib(n - 1) + fib(n - 2)
}
\`\`\`

- Ignore return expressions since you cannot inject a log statement before a return statement

\`\`\`ts ignore
if (!condition) return value
\`\`\`

- Ignore function calls, object structures or arrays since you cannot inject a log statement in the middle of an object or array.

\`\`\`ts ignore
const obj = { // DO NOT ADD LOG HERE
    a: 1,
    b: 2
}
throw new Error( // DO NOT ADD LOG HERE
    "bad")
func(// DO NOT ADD LOG HERE
    new Object())
)   s 
func({ // DO NOT ADD LOG HERE
    a: 1,
    b: 2
})
const arr = [ // DO NOT ADD LOG HERE
    1,
    2,
    3]
\`\`\`

### Good logs

- inject the log statement in valid code locations for TypeScript
- use the line number in ${filen} ([line] ...) to correctly identify the location of the log but do not include the line number in the log message
- use short informative messages, always lower cased
- before doing any kind of file operation, log the file path.
- In a catch handler, log the error.
- Only add log statement, DO NOT REMOVE OR CHANGE ANY EXISTING CODE.
- use ?. operator to avoid null checks
- use template strings to log variables
- do NOT add debug logs if they are already present
- do NOT add debug logs in unreachable code!
- do NOT add debug log when entering a function.
- do NOT add debug logs in object structures or arrays.
- if there are already enough debug logs, you don't need to add more. Just respond <NOP>.

## Output format

Generate a list of line number, debug statement pairs. Generate indentations as in the code.
For example, if you added debug statements at line 1, 7 and 13, the output should be:

[1]dbg(\`log message at line 1\`)
[7]    dbg(\`log message at line 7 \${somevariable}\`)
[13]dbg(\`log message at line 13\`)
`
        },
        {
            system: ["system.assistant", "system.typescript"],
            systemSafety: false,
            responseType: "text",
            temperature: 0.2,
        }
    )

    const { text } = res
    const updates = []
    text.replace(/^\[(\d+)\](\s*dbg\(['`].*['`]\))$/gm, (_, line, stm) => {
        updates.push({ line: parseInt(line) - 1, message: stm })
        return ""
    })
    // insert updates backwards
    updates.sort((a, b) => b.line - a.line)
    if (!updates.length) {
        output.warn("no debug logs found")
        return
    }
    output.item(`inserting ${updates.length} debug logs`)

    // apply updates
    const lines = file.content.split("\n")
    updates.forEach(({ line, message }, index) => {
        if (
            !lines[line - 1]?.includes("dbg(") &&
            !lines[line]?.includes("dbg(") &&
            !lines[line + 1]?.includes("dbg(")
        )
            lines.splice(line, 0, message)
    })
    const patched = lines.join("\n")
    await workspace.writeText(file.filename, patched)
    file = await workspace.readText(file.filename)

    let retry = 25
    while (retry-- > 0) {
        // compile file
        const tsc = await compile(file)
        if (!tsc.exitCode) {
            output.item("compiled successfully")
            await prettier(file)
            return
        }

        // remove first error and try to compile
        const errors = parsers.annotations(tsc.stderr)
        output.item(`found ${errors.length} errors`)
        const error = errors.find(
            (e) =>
                lines[e.range[0][0] - 1]?.includes("dbg(") ||
                lines[e.range[0][0]]?.includes("dbg(") ||
                lines[e.range[0][0] + 1]?.includes("dbg(")
        )
        if (!error) {
            output.warn("cannot find error with dbg")
            return
        }

        output.item(`removing error around ${error.range[0][0] + 1}`)
        if (lines[error.range[0][0] - 1]?.includes("dbg("))
            lines.splice(error.range[0][0] - 1, 1)
        else if (lines[error.range[0][0] + 1]?.includes("dbg("))
            lines.splice(error.range[0][0] + 1, 1)
        else lines.splice(error.range[0][0], 1)
        await workspace.writeText(file.filename, lines.join("\n"))
    }
}

export default async function () {
    for (const file of env.files.filter((f) => f.filename.endsWith(".ts"))) {
        await debugify(file)
    }
}
