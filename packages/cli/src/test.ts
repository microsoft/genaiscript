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
import { emptyDir, ensureDir } from "fs-extra"

export async function scriptsTest(
    id: string,
    options: { out?: string; cli?: string; removeOut?: boolean }
) {
    const prj = await buildProject()
    const scripts = prj.templates.filter((t) => t.tests?.length && t.id === id)
    if (!scripts.length) throw new Error(`no script with tests found`)

    const cli = options.cli || __filename
    const out = options.out || join(GENAISCRIPT_FOLDER, "tests")
    const provider = join(out, "provider.mjs")
    logVerbose(`writing tests to ${out}`)

    if (options?.removeOut) await emptyDir(out)
    await ensureDir(out)
    await writeFile(provider, promptFooDriver)
    for (const script of scripts) {
        logVerbose(`generating tests for ${script.id}`)
        const config = generatePromptFooConfiguration(script, {
            out,
            cli,
            provider: "provider.mjs",
        })
        const fn = out
            ? join(out, `${script.id}.promptfoo.yaml`)
            : script.filename.replace(/\.genai\.js$/, ".promptfoo.yaml")
        await writeFile(fn, YAMLStringify(config))
    }

    logVerbose(`running tests with promptfoo`)
    const cmd = "npx"
    const args = [
        "--yes",
        `promptfoo@latest`,
        "eval",
        "--config",
        `${out}/*.promptfoo.yaml`,
        "--verbose",
    ]
    const res = await execa(cmd, args, {
        preferLocal: true,
        cleanup: true,
        stripFinalNewline: true,
    })
        .pipeStdout(process.stdout)
        .pipeStderr(process.stderr)

    process.exit(res.exitCode)
}
