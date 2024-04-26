import { generatePromptFooConfiguration } from "genaiscript-core/src/test"
import { buildProject } from "./build"
import { PROMPTFOO_VERSION } from "./version"
import {
    YAMLStringify,
    dotGenaiscriptPath,
    promptFooDriver,
} from "genaiscript-core"
import { writeFile } from "fs/promises"
import { execa } from "execa"
import { join } from "node:path"
import { emptyDir, ensureDir } from "fs-extra"

export async function scriptsTest(id: string, options: { out?: string }) {
    const prj = await buildProject()
    const scripts = prj.templates.filter((t) => t.tests?.length && t.id === id)
    if (!scripts.length) throw new Error(`no script with tests found`)

    const out = options.out || dotGenaiscriptPath("tests")

    await ensureDir(out)
    await writeFile(join(out, "provider.mjs"), promptFooDriver)
    for (const script of scripts) {
        const config = generatePromptFooConfiguration(script, options)
        const fn = out
            ? join(out, `${script.id}.promptfoo.yaml`)
            : script.filename.replace(/\.genai\.js$/, ".promptfoo.yaml")
        await writeFile(fn, YAMLStringify(config))
    }

    const res = await execa("npx", [
        "--yes",
        `promptfoo@latest`,
        "eval",
        `${out}/*.promptfoo.yaml`,
        "--verbose",
    ])
        .pipeStdout(process.stdout)
        .pipeStderr(process.stderr)

    process.exit(res.exitCode)
}
