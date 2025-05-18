import { NPM_CLI_PACKAGE } from "./constants"
import { GenerationOptions } from "./generation"
import { MarkdownTrace } from "./trace"
import { arrayify, relativePath } from "./util"
import { CORE_VERSION } from "./version"
import { host } from "./host"
import { isCI } from "./ci"

/**
 * Generates command-line arguments for executing or batching a CLI prompt template.
 *
 * @param template - The prompt script template to execute.
 * @param options - The generation options to configure the CLI behavior.
 * @param command - The type of command to generate arguments for, either "run" or "batch".
 * @returns A string containing the constructed CLI command with arguments.
 *
 * Options in `options`:
 * - `model`: Specifies the AI model to use.
 * - `temperature`: Defines the randomness of the model's responses.
 * - `reasoningEffort`: Configures reasoning resource allocation.
 * - `fallbackTools`: Indicates whether fallback tools should be utilized.
 * - `topP`: Sets the nucleus sampling parameter for response generation.
 * - `seed`: Seed value for reproducible outputs.
 * - `cliInfo`: Contains additional CLI configuration, such as file lists.
 *
 * Note:
 * - File paths are converted to relative paths from the project folder.
 * - CLI utilizes the latest compatible version of the CLI package defined in constants.
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
 * Generates detailed instructions for executing a template script and its tests using the command-line interface.
 *
 * @param trace - An object used for logging or recording detailed explanations and steps.
 * @param template - The template script being executed, containing metadata such as the script's ID and associated tests.
 * @param options - Configuration options for the generation, including model, temperature, and additional settings.
 *
 * The function logs:
 * - The CLI command for running the script using the `run` command.
 * - A note regarding environment dependencies, such as Node.js and `.env` file usage.
 * - If applicable, the CLI command for testing the template if associated tests are defined.
 */
export function traceCliArgs(
    trace: MarkdownTrace,
    template: PromptScript,
    options: GenerationOptions
) {
    if (isCI) return

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
