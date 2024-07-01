import { generatePromptFooConfiguration } from "genaiscript-core/src/test"
import { buildProject } from "./build"
import {
    GENAISCRIPT_FOLDER,
    PromptScriptTestRunOptions,
    YAMLStringify,
    arrayify,
    host,
    logInfo,
    logVerbose,
    normalizeFloat,
    parseKeyValuePairs,
    promptFooDriver,
    serializeError,
    PROMPTFOO_CONFIG_DIR,
    PROMPTFOO_CACHE_PATH,
    FILES_NOT_FOUND_ERROR_CODE,
    MarkdownTrace,
    PromptScriptTestRunResponse,
    PromptScriptTestResult,
    EMOJI_FAIL,
    EMOJI_SUCCESS,
    GENAI_ANYJS_REGEX,
    JSON5TryParse,
    normalizeInt,
    delay,
} from "genaiscript-core"

import { readFile, writeFile, appendFile } from "node:fs/promises"
import { execa } from "execa"
import { dirname, join, resolve } from "node:path"
import { emptyDir, ensureDir, exists } from "fs-extra"
import type { OutputFile } from "promptfoo"
import { PROMPTFOO_VERSION } from "./version"

function parseModelSpec(m: string): ModelOptions {
    const values = parseKeyValuePairs(m)
    if (Object.keys(values).length > 1)
        return {
            model: values["m"],
            temperature: normalizeFloat(values["t"]),
            topP: normalizeFloat(values["p"]),
        }
    else return { model: m }
}

// build trigger..
async function resolveTestProvider(script: PromptScript) {
    const token = await host.getLanguageModelConfiguration(script.model)
    if (token && token.type === "azure") return token.base
    return undefined
}

function createEnv() {
    const env = process.env
    return {
        ...process.env,
        PROMPTFOO_CACHE_PATH: env.PROMPTFOO_CACHE_PATH ?? PROMPTFOO_CACHE_PATH,
        PROMPTFOO_CONFIG_DIR: env.PROMPTFOO_CONFIG_DIR ?? PROMPTFOO_CONFIG_DIR,
        PROMPTFOO_DISABLE_TELEMETRY: env.PROMPTFOO_DISABLE_TELEMETRY ?? "1",
        PROMPTFOO_DISABLE_UPDATE: env.PROMPTFOO_DISABLE_UPDATE ?? "1",
    }
}

export async function runPromptScriptTests(
    ids: string[],
    options: PromptScriptTestRunOptions & {
        out?: string
        cli?: string
        removeOut?: boolean
        cache?: boolean
        verbose?: boolean
        write?: boolean
        promptfooVersion?: string
        outSummary?: string
        testDelay?: string
    }
): Promise<PromptScriptTestRunResponse> {
    const prj = await buildProject()
    const scripts = prj.templates
        .filter((t) => arrayify(t.tests)?.length)
        .filter((t) => !ids?.length || ids.includes(t.id))
    if (!scripts.length)
        return {
            ok: false,
            status: FILES_NOT_FOUND_ERROR_CODE,
            error: serializeError(new Error("no tests found")),
        }

    const cli = options.cli || resolve(__filename)
    const out = options.out || join(GENAISCRIPT_FOLDER, "tests")
    const outSummary = options.outSummary
        ? resolve(options.outSummary)
        : undefined
    const provider = join(out, "provider.mjs")
    const models = options?.models
    const testDelay = normalizeInt(options?.testDelay)
    logInfo(`writing tests to ${out}`)

    if (options?.removeOut) await emptyDir(out)
    await ensureDir(out)
    await writeFile(provider, promptFooDriver)

    const configurations: { script: PromptScript; configuration: string }[] = []
    for (const script of scripts) {
        const fn = out
            ? join(out, `${script.id}.promptfoo.yaml`)
            : script.filename.replace(GENAI_ANYJS_REGEX, ".promptfoo.yaml")
        logInfo(`  ${fn}`)
        const testProvider =
            options?.testProvider || (await resolveTestProvider(scripts[0]))
        const config = generatePromptFooConfiguration(script, {
            out,
            cli,
            models: models?.map(parseModelSpec),
            provider: "provider.mjs",
            testProvider,
        })
        const yaml = YAMLStringify(config)
        await writeFile(fn, yaml)
        configurations.push({ script, configuration: fn })
    }

    await ensureDir(PROMPTFOO_CACHE_PATH)
    await ensureDir(PROMPTFOO_CONFIG_DIR)
    if (outSummary) {
        await ensureDir(dirname(outSummary))
        await appendFile(
            outSummary,
            `## GenAIScript Test Results

`
        )
    }

    const results: PromptScriptTestResult[] = []
    for (const config of configurations) {
        const { script, configuration } = config
        const outJson = configuration.replace(/\.yaml$/, ".res.json")
        const cmd = "npx"
        const args = [
            "--yes",
            `promptfoo@${options.promptfooVersion || PROMPTFOO_VERSION}`,
            "eval",
            "--config",
            configuration,
            "--max-concurrency",
            "1",
            "--no-progress-bar",
        ]
        if (!options.cache) args.push("--no-cache")
        if (options.verbose) args.push("--verbose")
        args.push("--output", outJson)
        logVerbose(`  ${cmd} ${args.join(" ")}`)
        const exec = execa(cmd, args, {
            preferLocal: true,
            cleanup: true,
            stripFinalNewline: true,
            buffer: false,
            env: createEnv(),
            stdio: "inherit",
        })
        let status: number
        let error: SerializedError
        let value: any = undefined
        try {
            const res = await exec
            status = res.exitCode
        } catch (e) {
            status = e.errno ?? -1
            error = serializeError(e)
        }
        if (await exists(outJson))
            value = JSON5TryParse(await readFile(outJson, "utf8")) as OutputFile

        const ok = status === 0
        if (outSummary)
            await appendFile(
                outSummary,
                `- ${ok ? EMOJI_SUCCESS : EMOJI_FAIL} ${script.id}\n`
            )
        results.push({
            status,
            ok,
            error,
            script: script.id,
            value,
        })

        if (testDelay > 0) {
            logVerbose(`  waiting ${testDelay}s`)
            await delay(testDelay * 1000)
        }
    }

    const ok = results.every((r) => !!r.ok)
    return {
        ok,
        status: ok ? 0 : -1,
        value: results,
        error: results.find((r) => r.error)?.error,
    }
}

export async function scriptsTest(
    ids: string[],
    options: PromptScriptTestRunOptions & {
        out?: string
        cli?: string
        removeOut?: boolean
        cache?: boolean
        verbose?: boolean
        write?: boolean
        promptfooVersion?: string
        outSummary?: string
        testDelay?: string
    }
) {
    const { status, value = [] } = await runPromptScriptTests(ids, options)
    const trace = new MarkdownTrace()
    trace.log(
        `tests: ${value.filter((r) => r.ok).length} success, ${value.filter((r) => !r.ok).length} failed`
    )
    for (const result of value) trace.resultItem(result.ok, result.script)
    console.log(trace.content)
    process.exit(status)
}

export async function scriptTestsView(options: { promptfooVersion?: string }) {
    await ensureDir(PROMPTFOO_CACHE_PATH)
    await ensureDir(PROMPTFOO_CONFIG_DIR)
    const cmd = `npx`
    const args = [
        "--yes",
        `promptfoo@${options.promptfooVersion || PROMPTFOO_VERSION}`,
        "view",
        "-y",
    ]
    console.debug(`launching promptfoo result server`)
    await execa(cmd, args, {
        cleanup: true,
        env: createEnv(),
        stdio: "inherit",
    })
}
