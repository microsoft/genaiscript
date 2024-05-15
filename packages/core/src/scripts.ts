import { Project } from "./ast"
import { NEW_SCRIPT_TEMPLATE } from "./constants"
import { promptDefinitions } from "./default_prompts"
import { tryReadText, writeText } from "./fs"
import { host } from "./host"
import { logVerbose } from "./util"

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

function scanTools(v: string) {
    const tools: { name: string; description: string }[] = []
    v.replace(
        /defTool\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"/gm,
        (m, name, description) => {
            tools.push({ name, description })
            return ""
        }
    )
    return tools
}

export async function fixPromptDefinitions(project: Project) {
    const folders = project.folders()
    for (const folder of folders) {
        for (let [defName, defContent] of Object.entries(promptDefinitions)) {
            if (project && defName === "genaiscript.d.ts") {
                const systems = project.templates.filter((t) => t.isSystem)
                const tools = systems
                    .map(({ jsSource }) => scanTools(jsSource))
                    .flat()

                // update the system prompt identifiers
                defContent = defContent
                    .replace(
                        "type SystemPromptId = string",
                        `type SystemPromptId = ${systems
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map((s) => JSON.stringify(s.id))
                            .join(" | ")}`
                    )
                    .replace(
                        "    system?: SystemPromptId[]",
                        `/**
* System prompt identifiers ([reference](https://microsoft.github.io/genaiscript/reference/scripts/system/))
${systems.map((s) => `* - \`${s.id}\`: ${s.title || s.description}`).join("\n")}
**/
    system?: SystemPromptId[]`
                    )

                // update the tool prompt identifiers
                defContent = defContent
                    .replace(
                        "type SystemToolId = string",
                        `type SystemToolId = ${tools
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((s) => JSON.stringify(s.name))
                            .join(" | ")}`
                    )
                    .replace(
                        "    tools?: SystemToolId[]",
                        `/**
* System tool identifiers ([reference](https://microsoft.github.io/genaiscript/reference/scripts/tools/))
${tools.map((s) => `* - \`${s.name}\`: ${s.description}`).join("\n")}
**/
    tools?: SystemToolId[]`
                    )
            }

            const current = await tryReadText(host.path.join(folder, defName))
            if (current !== defContent) {
                const fn = host.path.join(folder, defName)
                logVerbose(`updating ${fn}`)
                await writeText(fn, defContent)
            }
        }
    }
}
