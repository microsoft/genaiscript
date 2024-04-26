import { CORE_VERSION, RunTemplateOptions } from "."
import { Fragment } from "./ast"
import { NPM_CLI_PACKAGE } from "./constants"
import { generatePromptFooConfiguration } from "./test"
import { MarkdownTrace } from "./trace"

export function generateCliArguments(
    template: PromptScript,
    fragment: Fragment,
    options: RunTemplateOptions,
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
    fragment: Fragment,
    options: RunTemplateOptions
) {
    trace.details(
        "🤖 automation",
        `This operation can be automated using the command line interface using the \`run\` command:

\`\`\`bash
${generateCliArguments(template, fragment, options, "run")}
\`\`\`


-   You will need to install [Node.js LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
-   The CLI uses the same secrets in the \`.env\` file.
`
    )

    if (template.tests?.length) {
        trace.details(
            "🧪 testing",
            `
This [promptfoo](https://www.promptfoo.dev/) configuration can be used to test the script.

- save the configuration to \`${template.id}.promptfoo.yaml\`

\`\`\`yaml
${generatePromptFooConfiguration(template, options)}
\`\`\`

- run

\`\`\`sh
npx --yes promptfoo eval --verbose -c ${template.id}.promptfoo.yaml
\`\`\`
`
        )
    }
}
