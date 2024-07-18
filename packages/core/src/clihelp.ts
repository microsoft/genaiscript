import { NPM_CLI_PACKAGE } from "./constants"
import { GenerationOptions } from "./generation"
import { MarkdownTrace } from "./trace"
import { arrayify, relativePath } from "./util"
import { CORE_VERSION } from "./version"
import { host } from "./host"

export function generateCliArguments(
    template: PromptScript,
    options: GenerationOptions,
    command: "run" | "batch"
) {
    const { model, temperature, topP, seed, cliInfo } = options
    const { files = [] } = cliInfo || {}

    const cli = [
        "npx",
        "--yes",
        `${NPM_CLI_PACKAGE}@^${CORE_VERSION}`,
        command,
        template.id,
        ...files.map((f) => `"${relativePath(host.projectFolder(), f)}"`),
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
    template: PromptScript,
    options: GenerationOptions
) {
    trace.details(
        "🤖 automation",
        `Use the command line interface [run](https://microsoft.github.io/genaiscript/reference/cli/run/) to automate this task:

\`\`\`bash
${generateCliArguments(template, options, "run")}
\`\`\`


-   You will need to install [Node.js LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
-   The cli uses the same secrets in the \`.env\` file.
`
    )

    if (arrayify(template.tests)?.length) {
        trace.details(
            "🧪 testing",
            `
Use the command line interface [test](https://microsoft.github.io/genaiscript/reference/cli/test) to run the tests for this script:

\`\`\`sh
npx --yes genaiscript test ${template.id}
\`\`\`
`
        )
    }
}
