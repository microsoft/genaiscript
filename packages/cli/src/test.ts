import { generatePromptFooConfiguration } from "genaiscript-core/src/test"
import { buildProject } from "./build"
import { PROMPTFOO_VERSION } from "./version"
import {
    GENAISCRIPT_FOLDER,
    YAMLStringify,
    dotGenaiscriptPath,
    logVerbose,
    promptFooDriver,
} from "genaiscript-core"
import { writeFile } from "fs/promises"
import { execa } from "execa"
import { join } from "node:path"
import { ensureDir } from "fs-extra"

export async function scriptsTest(
    id: string,
    options: { out?: string; cli?: string }
) {
    const prj = await buildProject()
    const scripts = prj.templates.filter((t) => t.tests?.length && t.id === id)
    if (!scripts.length) throw new Error(`no script with tests found`)

    const out = options.out || join(GENAISCRIPT_FOLDER, "tests")
    logVerbose(`writing tests to ${out}`)

    await ensureDir(out)
    await writeFile(join(out, "provider.mjs"), promptFooDriver)
    for (const script of scripts) {
        logVerbose(`generating tests for ${script.id}`)
        const config = generatePromptFooConfiguration(script, options)
        const fn = out
            ? join(out, `${script.id}.promptfoo.yaml`)
            : script.filename.replace(/\.genai\.js$/, ".promptfoo.yaml")
        await writeFile(fn, YAMLStringify(config))
    }

    logVerbose(`running tests with promptfoo`)
    const res = await execa("npx", [
        "--yes",
        `promptfoo@latest`,
        "eval",
        "--config",
        `${out}/*.promptfoo.yaml`,
        "--verbose",
    ])
        .pipeStdout(process.stdout)
        .pipeStderr(process.stderr)

    process.exit(res.exitCode)
}
