import { collectFolders } from "./ast"
import { NEW_SCRIPT_TEMPLATE, TYPE_DEFINITION_BASENAME } from "./constants"
import { githubCopilotCustomPrompt, promptDefinitions } from "./default_prompts"
import { tryReadText, writeText } from "./fs"
import { host } from "./host"
import { dotGenaiscriptPath, logVerbose } from "./util"
import { dedent } from "./indent"
import { Project } from "./server/messages"
import { fetchText } from "./fetch"

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
        {
            const fn = host.path.join(dirname, ".gitignore")
            const current = (await tryReadText(fn)) || ""
            const content = dedent`genaiscript.d.ts
            tsconfig.json
            jsconfig.json`
            if (!current.includes(content)) {
                logVerbose(`updating ${fn}`)
                await writeText(fn, current + "\n#GenAIScript\n" + content)
            }
        }
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

export async function fixCustomPrompts(options?: {
    githubCopilotPrompt?: boolean
    docs?: boolean
}) {
    const { githubCopilotPrompt, docs } = options || {}
    // write genaiscript.d.ts
    const gdir = dotGenaiscriptPath()
    await writeText(
        host.path.join(gdir, TYPE_DEFINITION_BASENAME),
        promptDefinitions[TYPE_DEFINITION_BASENAME]
    ) // Write the TypeScript definition file
    if (githubCopilotPrompt) {
        const pdir = host.path.join(".github", "prompts")
        const pn = host.path.join(gdir, "genaiscript.prompt.md")
        await writeText(pn, githubCopilotCustomPrompt) // Write the GitHub Copilot prompt file
    }
    if (githubCopilotPrompt || docs) {
        const ddir = dotGenaiscriptPath("docs")
        for (const route of ["llms.txt", "llms-full.txt", "llms-small.txt"]) {
            const url = `https://microsoft.github.io/genaiscript/${route}`
            const dn = host.path.join(ddir, route)
            const content = await fetchText(url)
            if (!content.ok) throw new Error(String(content.statusText))
            await writeText(dn, content.text) // Write the GitHub Copilot prompt file
        }
    }
}
