import { collectFolders } from "./ast"
import {
    DOCS_URL,
    NEW_SCRIPT_TEMPLATE,
    TYPE_DEFINITION_BASENAME,
} from "./constants"
import {
    githubCopilotInstructions as ghInstructions,
    promptDefinitions,
} from "./default_prompts"
import { tryReadText, writeText } from "./fs"
import { host } from "./host"
import { logVerbose } from "./util"
import { Project } from "./server/messages"
import { collapseNewlines } from "./cleaners"
import { gitIgnoreEnsure } from "./gitignore"
import { dotGenaiscriptPath } from "./workdir"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("scripts")

/**
 * Creates a new script object based on the provided name and optional template.
 *
 * @param name - The name of the script.
 * @param options - Optional parameters for creating the script.
 * @param options.template - A template object to initialize the script content. Defaults to a basic empty template.
 * @param options.title - A custom title for the script. Defaults to the provided name.
 * @returns A new script object with the specified or default attributes.
 */
export function createScript(
    name: string,
    options?: { template: PromptScript; title?: string }
) {
    const { template, title } = options || {}
    const t = structuredClone(
        template || {
            id: "",
            title: title || name,
            text: "New script empty template",
            jsSource: NEW_SCRIPT_TEMPLATE,
        }
    )
    t.id = ""
    return t
}

/**
 * Updates prompt definition files based on the project configuration.
 *
 * Iterates through the project's collected folders and updates the corresponding
 * configuration and definition files (e.g., `genaiscript.d.ts`, `tsconfig.json`, `jsconfig.json`).
 * System and tool identifiers within the `genaiscript` TypeScript definition file
 * are dynamically updated with the systems and tools from the project scripts.
 *
 * @param project - The project configuration containing scripts and folder structure.
 *   - `project.scripts`: An array of scripts from the project, where system scripts determine tool usage.
 *   - `project.folders`: A set of folder data collected with relevant directory and file details.
 */
export async function fixPromptDefinitions(
    project: Project,
    options?: { force?: boolean }
) {
    const folders = collectFolders(project, options)
    const systems = project.scripts.filter((t) => t.isSystem)
    const tools = systems.map(({ defTools }) => defTools || []).flat()

    logVerbose(`fixing type definitions`)
    for (const folder of folders) {
        const { dirname, ts, js } = folder
        logVerbose(`  ${dirname}`)
        await gitIgnoreEnsure(dirname, [
            "genaiscript.d.ts",
            "tsconfig.json",
            "jsconfig.json",
        ])
        for (let [defName, defContent] of Object.entries(promptDefinitions)) {
            // patch genaiscript
            if (defName === "genaiscript.d.ts") {
                // update the system prompt identifiers
                defContent = defContent
                    .replace(
                        "type SystemPromptId = OptionsOrString<string>",
                        `type SystemPromptId = OptionsOrString<\n    | ${systems
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map((s) => JSON.stringify(s.id))
                            .join("\n    | ")}\n>`
                    )
                    .replace(
                        "    system?: SystemPromptId[]",
                        `    /**
     * System prompt identifiers ([reference](https://microsoft.github.io/genaiscript/reference/scripts/system/))
${systems.map((s) => `     * - \`${s.id}\`: ${s.title || s.description}`).join("\n")}
     **/
    system?: SystemPromptId[]`
                    )

                // update the tool prompt identifiers
                defContent = defContent
                    .replace(
                        "type SystemToolId = OptionsOrString<string>",
                        `type SystemToolId = OptionsOrString<\n    | ${tools
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map((s) => JSON.stringify(s.id))
                            .join("\n    | ")}\n>`
                    )
                    .replace(
                        "    tools?: SystemToolId[]",
                        `/**
* System tool identifiers ([reference](https://microsoft.github.io/genaiscript/reference/scripts/tools/))
${tools.map((s) => `* - \`${s.id}\`: ${s.description}`).join("\n")}
**/
    tools?: SystemToolId[]`
                    )
            }

            if (defName === "tsconfig.json" && !ts) continue
            if (defName === "jsconfig.json" && !js) continue

            const fn = host.path.join(dirname, defName)
            const current = await tryReadText(fn)
            if (current !== defContent) {
                logVerbose(`updating ${fn}`)
                await writeText(fn, defContent)
            }
        }
    }
}

let _fullDocsText: string
/**
 * Updates custom prompts and related files with new definitions and data.
 *
 * @param options - Options for customizing prompt behavior.
 * @param options.githubCopilotPrompt - If true, writes the GitHub Copilot custom prompt file.
 * @param options.docs - If true, fetches and writes updated documentation files.
 *
 * Writes the TypeScript definition file (`genaiscript.d.ts`) and manages files within the
 * `.genaiscript` directory. Optionally, creates GitHub Copilot prompt and documentation files
 * based on the provided options. Fetches external content for documentation updates if applicable.
 * Ensures `.gitignore` is updated to ignore all files in the `.genaiscript` directory.
 * Fetches and processes external documentation content if required.
 */
export async function fixGitHubCopilotInstructions(options?: {
    githubCopilotInstructions?: boolean
    docs?: boolean
}) {
    const { githubCopilotInstructions, docs } = options || {}
    // write genaiscript.d.ts
    const gdir = dotGenaiscriptPath()
    await writeText(host.path.join(gdir, ".gitignore"), "*")
    await writeText(
        host.path.join(gdir, TYPE_DEFINITION_BASENAME),
        promptDefinitions[TYPE_DEFINITION_BASENAME]
    ) // Write the TypeScript definition file
    if (githubCopilotInstructions) {
        const pdir = dotGenaiscriptPath("instructions")
        const pn = host.path.join(pdir, "genaiscript.instructions.md")
        await writeText(pn, ghInstructions) // Write the GitHub Copilot instructions file
    }
    if (githubCopilotInstructions || docs) {
        const ddir = dotGenaiscriptPath("instructions")
        const route = "llms-full.txt"
        const url = `${DOCS_URL}/${route}`
        const dn = host.path.join(ddir, route)
        let text = _fullDocsText
        if (!text) {
            const content = await fetch(url)
            if (!content.ok) logVerbose(`failed to fetch ${url}`)
            text = await content.text()
            text = _fullDocsText = collapseNewlines(
                text.replace(
                    /^\!\[\]\(<data:image\/svg\+xml,.*$/gm,
                    "<!-- mermaid diagram -->"
                )
            )
        }
        await writeText(dn, text) // Write the GitHub Copilot prompt file
    }
}
