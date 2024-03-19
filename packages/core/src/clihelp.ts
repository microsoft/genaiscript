import { RunTemplateOptions } from "."
import { Fragment } from "./ast"
import { GENAISCRIPT_CLI_JS, NPM_CLI_PACKAGE } from "./constants"
import { MarkdownTrace } from "./trace"

export function generateCliArguments(
    template: PromptTemplate,
    fragment: Fragment,
    options: RunTemplateOptions,
    command: "run" | "batch"
) {
    const { model, temperature, topP, seed, cliInfo } = options

    const cli = [
        "npx",
        "--yes",
        NPM_CLI_PACKAGE,
        command,
        template.id,
        `"${cliInfo.spec}"`,
        "--apply-edits",
    ]
    if (model) cli.push(`--model`, model)
    if (!isNaN(temperature)) cli.push(`--temperature`, temperature + "")
    if (!isNaN(topP)) cli.push(`--top-p`, topP + "")
    if (!isNaN(seed)) cli.push("--seed", seed + "")

    return cli.join(" ")
}

export function traceCliArgs(
    trace: MarkdownTrace,
    template: PromptTemplate,
    fragment: Fragment,
    options: RunTemplateOptions
) {
    trace.details(
        "🤖 automation",
        `This operation can be automated using the command line interface.

- to run on all files at once, use the \`run\` command:

\`\`\`bash
${generateCliArguments(template, fragment, options, "run")}
\`\`\`

- to run a LLM generation on each file, use the \`batch\` command:

\`\`\`bash
${generateCliArguments(template, fragment, options, "batch")}
\`\`\`


-   You will need to install [Node.js](https://nodejs.org/en/).
-   The \`${GENAISCRIPT_CLI_JS}\` is written by the Visual Studio Code extension automatically.
-   The CLI uses the same secrets in the \`.env\` file.
-   Run \`node .genaiscript/genaiscript help run\` for the full list of options.
`
    )
}
