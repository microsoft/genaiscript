import { collectFolders } from "./ast"
import {
    DOCS_URL,
    NEW_SCRIPT_TEMPLATE,
    TYPE_DEFINITION_BASENAME,
} from "./constants"
import { githubCopilotCustomPrompt, promptDefinitions } from "./default_prompts"
import { tryReadText, writeText } from "./fs"
import { host } from "./host"
import { logVerbose } from "./util"
import { Project } from "./server/messages"
import { fetchText } from "./fetch"
import { collapseNewlines } from "./cleaners"
import { gitIgnoreEnsure } from "./gitignore"
import { dotGenaiscriptPath } from "./workdir"

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
