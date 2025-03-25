import { NPM_CLI_PACKAGE } from "./constants"
import { GenerationOptions } from "./generation"
import { MarkdownTrace } from "./trace"
import { arrayify, relativePath } from "./util"
import { CORE_VERSION } from "./version"
import { host } from "./host"

/**
 * Generates command line interface arguments for the specified template and options.
 * 
 * @param template The prompt script to be executed.
 * @param options Configuration options for generation including model, temperature, and file information.
 * @param command The command to execute, either "run" or "batch".
 * 
 * @returns A string containing the CLI command with appropriate arguments.
 */
export function generateCliArguments(
    template: PromptScript,
    options: GenerationOptions,
    command: "run" | "batch"
) {
    const {
        model,
        temperature,
        reasoningEffort,
        fallbackTools,
        topP,
        seed,
        cliInfo,
    } = options
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
    if (reasoningEffort) cli.push("--reasoning-effort", reasoningEffort)
    if (fallbackTools) cli.push("--fallback-tools")

    return cli.join(" ")
}

/**
 * Traces the command line arguments for automation and testing of a given template.
 * 
 * This function generates and logs detailed information about how to automate 
 * tasks using the command line interface (CLI) and how to run tests for the 
 * provided template.
 * 
 * The generated CLI command for automation is based on the provided options 
 * and is formatted as a bash code block in the trace. Additionally, if the 
 * template contains tests, it logs the command to run those tests in a 
 * separate section.
 * 
 * Installation requirements for Node.js LTS are also mentioned, along with 
 * information about the usage of secrets from the .env file.
 * 
 * @param trace - The MarkdownTrace instance used to log details.
 * @param template - The PromptScript template for which the commands are generated.
 * @param options - The GenerationOptions containing configuration values for CLI commands.
 */
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
