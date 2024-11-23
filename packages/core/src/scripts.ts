import { collectFolders, Project } from "./ast"
import { NEW_SCRIPT_TEMPLATE } from "./constants"
import { promptDefinitions } from "./default_prompts"
import { tryReadText, writeText } from "./fs"
import { host } from "./host"
import { logVerbose } from "./util"
import { dedent } from "./indent"

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
            const current = await tryReadText(fn)
            const content = dedent`# auto-generated
            genaiscript.d.ts
            tsconfig.json
            jsconfig.json`
            if (current !== content) {
                logVerbose(`updating ${fn}`)
                await writeText(fn, content)
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
