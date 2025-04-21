import { collectFolders } from "./ast"
import {
    DOCS_URL,
    NEW_SCRIPT_TEMPLATE,
    RESOURCE_HASH_LENGTH,
    TYPE_DEFINITION_BASENAME,
} from "./constants"
import { githubCopilotCustomPrompt, promptDefinitions } from "./default_prompts"
import { tryReadText, writeText } from "./fs"
import { host, runtimeHost } from "./host"
import { logVerbose } from "./util"
import { Project } from "./server/messages"
import { fetchText } from "./fetchtext"
import { collapseNewlines } from "./cleaners"
import { gitIgnoreEnsure } from "./gitignore"
import { dotGenaiscriptPath } from "./workdir"
import { join } from "node:path"
import { CancellationOptions } from "./cancellation"
import { tryResolveResource } from "./resources"
import { TraceOptions } from "./trace"
import { genaiscriptDebug } from "./debug"
import { hash } from "./crypto"
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
export async function fixPromptDefinitions(project: Project) {
    const folders = collectFolders(project)
    const systems = project.scripts.filter((t) => t.isSystem)
    const tools = systems.map(({ defTools }) => defTools || []).flat()

    for (const folder of folders) {
        const { dirname, ts, js } = folder
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
export async function fixCustomPrompts(options?: {
    githubCopilotPrompt?: boolean
    docs?: boolean
}) {
    const { githubCopilotPrompt, docs } = options || {}
    // write genaiscript.d.ts
    const gdir = dotGenaiscriptPath()
    await writeText(host.path.join(gdir, ".gitignore"), "*")
    await writeText(
        host.path.join(gdir, TYPE_DEFINITION_BASENAME),
        promptDefinitions[TYPE_DEFINITION_BASENAME]
    ) // Write the TypeScript definition file
    if (githubCopilotPrompt) {
        const pdir = dotGenaiscriptPath("prompts")
        const pn = host.path.join(pdir, "genaiscript.prompt.md")
        await writeText(pn, githubCopilotCustomPrompt) // Write the GitHub Copilot prompt file
    }
    if (githubCopilotPrompt || docs) {
        const ddir = dotGenaiscriptPath("docs")
        const route = "llms-full.txt"
        const url = `${DOCS_URL}/${route}`
        const dn = host.path.join(ddir, route)
        let text = _fullDocsText
        if (!text) {
            const content = await fetchText(url)
            if (!content.ok) logVerbose(`failed to fetch ${url}`)
            text = _fullDocsText = collapseNewlines(
                content.text.replace(
                    /^\!\[\]\(<data:image\/svg\+xml,.*$/gm,
                    "<!-- mermaid diagram -->"
                )
            )
        }
        await writeText(dn, text) // Write the GitHub Copilot prompt file
    }
}

/**
 * Attempts to resolve a script from the provided URL and manages caching.
 *
 * @param url - The URL of the resource to resolve.
 * @param options - Optional tracing and cancellation options.
 *   - TraceOptions: Includes trace-level details for debugging purposes.
 *   - CancellationOptions: Optionally permits cancellation during the process.
 * @returns The filename of the resolved script or undefined if resolution fails.
 *
 * If the resource is found, it checks for cached content. If cached, it computes a hash
 * and resolves the resource file within a managed `.genaiscript/resources` directory.
 * If no cached content is found, it returns the filename of the first file in the resource.
 */
export async function tryResolveScript(
    url: string,
    options?: TraceOptions & CancellationOptions
): Promise<string> {
    const resource = await tryResolveResource(url, options)
    if (!resource) return undefined

    const { uri, files } = resource
    dbg(`resolved resource %s %d`, uri, files?.length)
    if (!files?.length) return undefined

    const cache = files.some((f) => f.content)
    if (!cache) return files[0].filename
    else {
        const sha = await hash([files], {
            length: RESOURCE_HASH_LENGTH,
        })
        const fn = dotGenaiscriptPath(
            "resources",
            uri.protocol,
            uri.hostname,
            sha
        )
        dbg(`resolved cache: %s`, fn)
        const cached = files.map((f) => ({
            ...f,
            filename: join(fn, f.filename),
        }))
        await runtimeHost.workspace.writeFiles(cached)
        return cached[0].filename
    }
}
