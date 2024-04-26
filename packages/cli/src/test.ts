import { generatePromptFooConfiguration } from "genaiscript-core/src/test"
import { buildProject } from "./build"
import { PROMPTFOO_VERSION } from "./version"
import { YAMLStringify } from "genaiscript-core"
import { writeFile } from "fs/promises"
import { execa } from "execa"

export async function scriptsTest(id: string, options: {}) {
    const prj = await buildProject()
    const script = prj.templates.find((t) => t.id === id)
    if (!script) throw new Error(`Script ${id} not found`)
    if (!script.tests?.length) throw new Error(`Script ${id} has no tests`)

    const config = generatePromptFooConfiguration(script)
    const out = script.filename.replace(".genai.js", ".promptfoo.yaml")
    await writeFile(out, YAMLStringify(config))

    const res = await execa("npx", [
        "--yes",
        `promptfoo@${PROMPTFOO_VERSION}`,
        "eval",
        out,
        "--verbose",
    ]).pipeStdout(process.stdout).pipeStderr(process.stderr)

    process.exit(res.exitCode)
}
