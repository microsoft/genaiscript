import { generatePromptFooConfiguration } from "genaiscript-core/src/test"
import { buildProject } from "./build"
import {
    EXEC_MAX_BUFFER,
    GENAISCRIPT_FOLDER,
    ResponseStatus,
    TestRunOptions,
    YAMLStringify,
    arrayify,
    host,
    logVerbose,
    normalizeFloat,
    parseKeyValuePairs,
    promptFooDriver,
} from "genaiscript-core"
import { writeFile } from "node:fs/promises"
import { execa } from "execa"
import { join } from "node:path"
import { emptyDir, ensureDir } from "fs-extra"

function parseModelSpec(m: string): ModelOptions {
    const vals = parseKeyValuePairs(m)
    if (Object.keys(vals).length)
        return {
            model: vals["m"],
            temperature: normalizeFloat(vals["t"]),
            topP: normalizeFloat(vals["p"]),
        }
    else return { model: m }
}

async function resolveTestProvider(script: PromptScript) {
    const token = await host.getSecretToken(script)
    if (token && token.type === "azure") return token.base
    return undefined
}

export async function runTests(
    ids: string[],
    options: TestRunOptions & {
        out?: string
        cli?: string
        removeOut?: boolean
        cache?: boolean
        verbose?: boolean
        write?: boolean
    }
): Promise<ResponseStatus> {
    const prj = await buildProject()
    const scripts = prj.templates
        .filter((t) => arrayify(t.tests)?.length)
        .filter((t) => !ids?.length || ids.includes(t.id))
    if (!scripts.length)
        return {
            ok: false,
            status: 404,
        }

    const cli = options.cli || __filename
    const out = options.out || join(GENAISCRIPT_FOLDER, "tests")
    const provider = join(out, "provider.mjs")
    const testProvider =
        options?.testProvider || (await resolveTestProvider(scripts[0]))
    const models = options?.models
    logVerbose(`writing tests to ${out}`)

    if (options?.removeOut) await emptyDir(out)
    await ensureDir(out)
    await writeFile(provider, promptFooDriver)
    for (const script of scripts) {
        const fn = out
            ? join(out, `${script.id}.promptfoo.yaml`)
            : script.filename.replace(/\.genai\.js$/, ".promptfoo.yaml")
        logVerbose(`  ${fn}`)
        const config = generatePromptFooConfiguration(script, {
            out,
            cli,
            models: models?.map(parseModelSpec),
            provider: "provider.mjs",
            testProvider,
        })
        await writeFile(fn, YAMLStringify(config))
    }

    const outJson = join(out, "res.json")

    const cmd = "npx"
    const args = [
        "--yes",
        `promptfoo@latest`,
        "eval",
        "--config",
        `${out}/*.promptfoo.yaml`,
        "--max-concurrency",
        "1",
    ]
    if (!options.cache) args.push("--no-cache")
    if (options.verbose) args.push("--verbose")
    args.push("--output", outJson)
    logVerbose(`running tests with promptfoo`)
    logVerbose(`  ${cmd} ${args.join(" ")}`)
    const exec = execa(cmd, args, {
        preferLocal: true,
        cleanup: true,
        stripFinalNewline: true,
        buffer: false,
        maxBuffer: 16,
    })
    exec.pipeStdout(process.stdout)
    exec.pipeStderr(process.stdout)
    const res = await exec
    return { ok: res.exitCode === 0, status: res.exitCode }
}

export async function scriptsTest(
    ids: string[],
    options: TestRunOptions & {
        out?: string
        cli?: string
        removeOut?: boolean
        view?: boolean
        cache?: boolean
        verbose?: boolean
        write?: boolean
    }
) {
    const { status } = await runTests(ids, options)
    if (options.view)
        await execa("npx", ["--yes", "promptfoo@latest", "view", "-y"], {
            cleanup: true,
            maxBuffer: EXEC_MAX_BUFFER,
        })
    else process.exit(status)
}
