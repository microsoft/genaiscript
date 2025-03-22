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
Add debug log **statement** in the code to allow the developer to understand a program execution from looking at the logs.
You can inject the comment before or after the targetted line of code.

\`\`\`ts
dbg('message')
\`\`\`

You should generate log statement that will be injected into the code. The existing line of code will
be moved down.

original code:
\`\`\`ts
function fib(n: number): number {
    if (n <= 1) {
        return n
    }
    return fib(n - 1) + fib(n - 2)
}
\`\`\`

After adding debug logs:
\`\`\`ts
function fib(n: number): number {
    if (n <= 1) {
        dbg('n <= 1')
        return n
    }
    dbg('returning fib(n - 1) + fib(n - 2)')
    return fib(n - 1) + fib(n - 2)
}
\`\`\`

- When commenting about an if statement, place comment inside the if statement

\`\`\`ts
if (condition) {
  dgb('explain the condition')
  return value
}
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
- do NOT add debug logs for logging statemnts like console.log, console.error, logVerbose, ...
- do NOT add debug logs before a function declaration
- place debug logs for variable declarations after the declaration
- if there are already enough debug logs, you don't need to add more. Just respond <NOP>.
- generate indentations as in the code.

## Output format

Generate a list of 'line number, insert location (b = before,a = after), debug statement' entries.
For example, if you added debug statements at before line 1, after 7 and after 13, the output should be:

[1:b]dbg(\`insert log message before line 1\`)
[7:a]    dbg(\`log message at line 7 \${somevariable}\`)
[13:a]dbg(\`insert log message after line 13\`)
`
        },
        {
            system: ["system.assistant", "system.typescript"],
            systemSafety: false,
            responseType: "text",
            temperature: 0.2,
            logprobs: true,
        }
    )

    const { text } = res
    const updates = []
    text.replace(
        /^\[(\d+):(a|b)\](\s*dbg\(['`].*['`]\))$/gm,
        (_, line, pos, stm) => {
            updates.push({ line: parseInt(line) - 1, pos, message: stm })
            return ""
        }
    )
    // insert updates backwards
    updates.sort((a, b) => b.line - a.line)
    if (!updates.length) {
        output.warn("no debug logs found")
        return
    }
    output.item(`inserting ${updates.length} debug logs`)

    // apply updates
    const lines = file.content.split("\n")
    const skipRegex = /(logVerbose|logInfo|logError|dbg)\(/
    updates.forEach(({ line, pos, message }, index) => {
        if (
            !skipRegex.test(lines[line]) &&
            !skipRegex.test(lines[line + 1]) &&
            !skipRegex.test(lines[line - 1])
        ) {
            if (pos === "b") lines.splice(line, 0, message)
            else lines.splice(line + 1, 0, message)
        }
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
    for (const file of env.files.filter(
        (f) => f.filename.endsWith(".ts") && !f.filename.endsWith(".test.ts")
    )) {
        await debugify(file)
    }
}
