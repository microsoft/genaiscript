import { Fragment } from "./ast"
import { NPM_CLI_PACKAGE } from "./constants"
import { GenerationOptions } from "./promptcontext"
import { generatePromptFooConfiguration } from "./test"
import { MarkdownTrace } from "./trace"
import { arrayify } from "./util"
import { CORE_VERSION } from "./version"
import { YAMLStringify } from "./yaml"

export function generateCliArguments(
    template: PromptScript,
    options: GenerationOptions,
    command: "run" | "batch"
) {
    const { model, temperature, topP, seed, cliInfo } = options

    const cli = [
        "npx",
        "--yes",
        `${NPM_CLI_PACKAGE}@^${CORE_VERSION}`,
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
    template: PromptScript,
    options: GenerationOptions
) {
    trace.details(
        "🤖 automation",
        `This operation can be automated using the [command line interface](https://microsoft.github.io/genaiscript/reference/cli/run/):

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
- run the [test command](https://microsoft.github.io/genaiscript/reference/cli/test):

\`\`\`sh
npx --yes genaiscript test ${template.id}
\`\`\`
`
        )
    }
}
