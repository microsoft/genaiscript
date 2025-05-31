import { resolve } from "node:path"
import { deleteUndefinedValues } from "../../core/src/cleaners"
import { GENAI_ANY_REGEX } from "../../core/src/constants"
import { genaiscriptDebug } from "../../core/src/debug"
import { nodeTryReadPackage } from "../../core/src/nodepackage"
import { CORE_VERSION } from "../../core/src/version"
import { YAMLStringify } from "../../core/src/yaml"
import { buildProject } from "./build"
import { snakeCase } from "es-toolkit"
import { logInfo, logVerbose } from "../../core/src/util"
import { dotGenaiscriptPath } from "../../core/src/workdir"
import { tryStat, writeText } from "../../core/src/fs"
import { dedent } from "../../core/src/indent"
import { runtimeHost } from "../../core/src/host"
import { shellInput } from "./input"
import { copyPrompt } from "../../core/src/copy"
import { createScript as coreCreateScript } from "../../core/src/scripts"

const dbg = genaiscriptDebug("cli:action")

interface GitHubActionFieldType {
    description: string
    required?: boolean
    default?: string
}

/**
 * Generates GitHub Action files for a given script, including action.yml, Dockerfile, package.json, README.md, and .gitignore, using script metadata and provided options.
 *
 * If scriptId is not provided, prompts the user for the script name and initializes a new script. If scriptId is given, attempts to load the script from the project.
 *
 * Parameters:
 *   scriptId: The identifier or filename of the script for which action files will be generated. If falsy, user will be prompted to enter a name and a new script will be created.
 *   options: Configuration object with the following optional properties:
 *     force: If true, overwrite existing files without prompting.
 *     out: Output directory for generated files. Defaults to action/<script.id> under the genaiscript workspace.
 *     ffmpeg: If true, install ffmpeg in the Docker image.
 *     python: If true, install python3 and py3-pip in the Docker image.
 *     playwright: If true, use Playwright Docker image and install Playwright dependencies.
 *     packageLock: If true, generate a package-lock.json file using npm ci or npm install.
 *     image: Base Docker image to use. Defaults to Playwright image if playwright flag is set, otherwise node:lts-alpine.
 *     apks: Additional Alpine packages to install in the Docker image.
 *     provider: Name of the GenAI provider to use in the start command.
 *
 * Throws:
 *   Error if the script cannot be found when scriptId is provided.
 *
 * Side Effects:
 *   Writes or overwrites files in the output directory.
 *   Executes npm or node commands to generate lock files if packageLock is set.
 */
export async function actionConfigure(
    scriptId: string,
    options: {
        force?: boolean
        out?: string
        ffmpeg?: boolean
        python?: boolean
        playwright?: boolean
        packageLock?: boolean
        image?: string
        apks?: string[]
        provider?: string
    }
) {
    let script: PromptScript
    if (!scriptId) {
        scriptId = await shellInput("Enter the name of the script") // Prompt user for script name if not provided
        if (!scriptId) return
        script = coreCreateScript(scriptId) // Call core function to create a script
        await copyPrompt(script, {
            fork: true,
            name: scriptId,
            javascript: false,
        })
    } else {
        const prj = await buildProject() // Build the project to get script templates
        script = prj.scripts.find(
            (t) =>
                t.id === scriptId ||
                (t.filename &&
                    GENAI_ANY_REGEX.test(scriptId) &&
                    resolve(t.filename) === resolve(scriptId))
        )
    }
    if (!script) throw new Error("Script not found: " + scriptId)
    const {
        force,
        out = dotGenaiscriptPath("action", script.id),
        ffmpeg,
        playwright,
        packageLock,
        python,
        provider,
    } = options || {}
    const image =
        options.image ||
        (playwright
            ? "mcr.microsoft.com/playwright:v1.52.0-noble"
            : "node:lts-alpine")

    logInfo(`Generating GitHub Action for ${script.id} (${script.filename})`)
    logVerbose(`docker image: ${image}`)
    const { inputSchema, branding } = script
    const scriptSchema = (inputSchema?.properties
        .script as JSONSchemaObject) || {
        type: "object",
        properties: {},
        required: [],
    }
    const inputs: Record<string, GitHubActionFieldType> = {
        ...Object.fromEntries(
            Object.entries(scriptSchema.properties).map(([key, value]) => {
                return [
                    snakeCase(key),
                    {
                        description:
                            (value as JSONSchemaDescribed).description || "",
                        required: scriptSchema.required?.includes(key) || false,
                        default: (value as any).default ?? undefined,
                    } satisfies GitHubActionFieldType,
                ]
            })
        ),
        github_token: {
            description:
                "GitHub token with `models: read` permission at least.",
            required: true,
        },
        github_issue: {
            description: "GitHub issue number to use when generating comments.",
        },
        debug: {
            description: "Enable debug logging.",
            required: false,
        },
    }
    const outputs: Record<string, GitHubActionFieldType> = {
        text: {
            description: "The generated text output.",
        },
        data: {
            description:
                "The generated JSON data output, parsed and stringified.",
        },
    }

    const { owner = "<owner>", repo = "<repo>" } = (await github.info()) || {}
    const pkg = (await nodeTryReadPackage()) || {}

    const apks = [
        "git",
        python ? "python3" : undefined,
        python ? "py3-pip" : undefined,
        ffmpeg ? "ffmpeg" : undefined,
        ...(options?.apks || []),
    ].filter(Boolean)

    const writeFile = async (name: string, content: string) => {
        const filePath = resolve(out, name)
        if (!force && (await tryStat(filePath))) {
            logInfo(
                `skipping ${filePath} (file already exists), use --force to overwrite`
            )
        } else {
            logVerbose(`writing ${filePath}`)
            await writeText(filePath, content)
        }
    }

    await writeFile(
        "action.yml",
        YAMLStringify(
            deleteUndefinedValues({
                name: script.id,
                author: pkg.author || undefined,
                description: script.title || "GitHub Action for " + script.id,
                inputs,
                outputs,
                branding,
                runs: {
                    using: "docker",
                    image: "Dockerfile",
                },
            })
        )
    )

    await writeFile(
        "Dockerfile",
        dedent`# For additional guidance on containerized actions, see https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-docker-container-action
FROM ${image}

# Install packages
RUN apk add --no-cache ${apks.join(" ")}

# Set working directory
WORKDIR /genaiscript/action

# Copy source code
COPY . .

# Install dependencies
RUN npm ${packageLock ? "ci" : "install"}

${
    playwright
        ? dedent`# Install playwright dependencies
RUN npx playwright install --with-deps

`
        : ""
}
# GitHub Action forces the WORKDIR to GITHUB_WORKSPACE 
ENTRYPOINT ["npm", "--prefix", "/genaiscript/action", "start"]
`
    )
    await writeFile(
        "README.md",
        dedent`# ${script.id} action

A custom GitHub Action that runs the script \`${script.id}\`.

${script.description || ""}

## Inputs

${Object.entries(inputs || {})
    .map(
        ([key, value]) =>
            `- \`${key}\`: ${value.description}${
                value.required ? " (required)" : ""
            }${value.default ? ` (default: \`${value.default}\`)` : ""}`
    )
    .join("\n")}

## Outputs

${Object.entries(outputs || {})
    .map(
        ([key, value]) =>
            `- \`${key}\`: ${value.description || ""}${
                value.required ? " (required)" : ""
            }${value.default ? ` (default: \`${value.default}\`)` : ""}`
    )
    .join("\n")}

## Usage

\`\`\`yaml
uses: ${script.id}-action
with:
${Object.keys(inputs || {})
    .map((key) => `  ${key}: \${{ ... }}`)
    .join("\n")}
\`\`\`

## Example

\`\`\`yaml
name: Run ${script.id} Action
on:
    workflow_dispatch:
    push: # TODO: update event type
permissions:
    contents: read
    models: read
concurrency:
    group: \${{ github.workflow }}-\${{ github.ref }}
    cancel-in-progress: true
jobs:
  run-script:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ${owner}/${repo}@main
        with:
${Object.entries(inputs || {})
    .map(([key, value]) => `          ${key}: \${{ ... }}`)
    .join("\n")}
\`\`\`

## Development

This action was automatically generated by GenAIScript from the script metadata.
We recommend updating the script metadata instead of editing the action files directly.

- the action inputs are inferred from the script parameters
- the action outputs are inferred from the script output schema
- the action description is the script title
- the readme description is the script description
- the action branding is the script branding

To **regenerate** the action files (\`action.yml\`, \`Dockerfile\`, \`README.md\`, \`package.json\`, \`.gitignore\`), run:

\`\`\`bash
npm run configure
\`\`\`

> [!CAUTION]
> This will overwrite any changes you made to these files!

To lint script files, run:

\`\`\`bash
npm run lint
\`\`\`

To typecheck the scripts, run:
\`\`\`bash
npm run typecheck
\`\`\`

To build the Docker image locally, run:
\`\`\`bash
npm run docker:build
\`\`\`

To run the action locally in Docker (build it first), use:
\`\`\`bash
npm run docker:start
\`\`\`

`
    )
    await writeFile(
        ".gitignore",
        dedent`node_modules
.genaiscript
.env
.*.env
.env.*
`
    )

    await writeFile(
        "package.json",
        JSON.stringify(
            deleteUndefinedValues({
                name: script.id + "-action",
                version: CORE_VERSION,
                author: pkg.author,
                license: pkg.license,
                description:
                    script.description || "GitHub Action for " + script.id,
                dependencies: {
                    ...(pkg.dependencies || {}),
                    genaiscript: "^" + CORE_VERSION,
                },
                scripts: {
                    "docker:build": `docker build -t ${script.id}-action .`,
                    "docker:start": `docker run -e GITHUB_TOKEN ${script.id}-action`,
                    lint: `npx --yes prettier --write genaisrc/`,
                    typecheck: `genaiscript scripts compile`,
                    configure: `genaiscript action configure ${scriptId} --out .`,
                    start: [
                        `genaiscript`,
                        `run`,
                        scriptId,
                        `--github-workspace`,
                        provider ? `--provider` : undefined,
                        provider,
                    ]
                        .filter(Boolean)
                        .join(" "),
                },
            }),
            null,
            2
        )
    )

    // generate package-lock.json
    if (packageLock) {
        logVerbose("generating package-lock.json")
        await runtimeHost.exec(undefined, "node", ["install"], {
            cwd: out,
        })
    }
}
