import { Project } from "./ast"
import { GENAI_JS_GLOB } from "./constants"
import { promptDefinitions } from "./default_prompts"
import { readText, writeText } from "./fs"
import { host } from "./host"

export function createScript(
    name: string,
    options?: { template: PromptTemplate; title?: string }
) {
    const { template, title } = options || {}
    const t = structuredClone(
        template || {
            id: "",
            title: title || name,
            text: "New script empty template",
            jsSource: `// metadata and model configuration
// https://microsoft.github.io/genaiscript/reference/scripts/metadata/
script({ title: "${name}" })

// use def to emit LLM variables 
// https://microsoft.github.io/genaiscript/reference/scripts/context/#definition-def
def("FILE", env.files)

// use $ to output formatted text to the prompt
// https://microsoft.github.io/genaiscript/reference/scripts/prompt/
$\`You are a helpful assistant.
TELL THE LLM WHAT TO DO...\`        

// next, "Run GenAIScript" on a file or folder
// https://microsoft.github.io/genaiscript/getting-started/running-scripts/
`,
        }
    )
    t.id = ""
    return t
}

export async function fixPromptDefinitions(project: Project) {
    const folders = new Set(
        Object.values(project.templates)
            .filter((t) => t.filename)
            .map((t) => host.path.dirname(t.filename))
    )
    for (const folder of folders) {
        for (let [defName, defContent] of Object.entries(promptDefinitions)) {
            if (project && defName === "genaiscript.d.ts") {
                const systems = project.templates
                    .filter((t) => t.isSystem)
                    .map((s) => `"${s.id}"`)
                defContent = defContent.replace(
                    "type SystemPromptId = string",
                    `type SystemPromptId = ${systems.join(" | ")}`
                )
            }

            const current = await readText(host.path.join(folder, defName))
            if (current !== defContent)
                await writeText(host.path.join(folder, defName), defContent)
        }
    }
}
