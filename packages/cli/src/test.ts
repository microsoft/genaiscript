// This module provides functionality to test prompt scripts, including running,
// listing, and viewing results. It handles configuration setup, execution logic,
// and result processing.

import { buildProject } from "./build"
import { readFile, writeFile, appendFile } from "node:fs/promises"
import { execa } from "execa"
import { dirname, join, resolve } from "node:path"
import { emptyDir, ensureDir, exists } from "fs-extra"
import { PROMPTFOO_VERSION } from "./version"
import {
    PROMPTFOO_CACHE_PATH,
    PROMPTFOO_CONFIG_DIR,
    FILES_NOT_FOUND_ERROR_CODE,
    GENAISCRIPT_FOLDER,
    GENAI_ANY_REGEX,
    EMOJI_SUCCESS,
    EMOJI_FAIL,
} from "../../core/src/constants"
import { promptFooDriver } from "../../core/src/default_prompts"
import { serializeError } from "../../core/src/error"
import { parseKeyValuePairs } from "../../core/src/fence"
import { host } from "../../core/src/host"
import { JSON5TryParse } from "../../core/src/json5"
import { MarkdownTrace } from "../../core/src/trace"
import {
    normalizeFloat,
    arrayify,
    normalizeInt,
    logInfo,
    logVerbose,
    tagFilter,
    toStringList,
} from "../../core/src/util"
import { YAMLStringify } from "../../core/src/yaml"
import {
    PromptScriptTestRunOptions,
    PromptScriptTestRunResponse,
    PromptScriptTestResult,
} from "../../core/src/server/messages"
import { generatePromptFooConfiguration } from "../../core/src/test"
import { delay } from "es-toolkit"
import {
    ModelConnectionInfo,
    resolveModelConnectionInfo,
} from "../../core/src/models"

/**
 * Parses model specifications from a string and returns a ModelOptions object.
 * @param m - The string representation of the model specification.
 * @returns A ModelOptions object with model, temperature, and topP fields if applicable.
 */
function parseModelSpec(m: string): ModelOptions {
    const values = m
        .split(/&/g)
        .map((kv) => kv.split("=", 2))
        .reduce(
            (acc, [key, value]) => {
                acc[key] = decodeURIComponent(value)
                return acc
            },
            {} as Record<string, string>
        )
    if (Object.keys(values).length > 1)
        return {
            model: values["m"],
            smallModel: values["s"],
            visionModel: values["v"],
            temperature: normalizeFloat(values["t"]),
            topP: normalizeFloat(values["p"]),
        }
    else return { model: m }
}

/**
 * Creates an environment object for execution with defaults and optional overrides.
 * @returns An environment object with necessary configurations.
 */
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

/**
 * Runs prompt script tests based on provided IDs and options, returns the test results.
 * @param ids - Array of script IDs to run tests on.
 * @param options - Options to configure the test run.
 * @returns A Promise resolving to the test run response.
 */
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
    if (options.model) host.defaultModelOptions.model = options.model
    if (options.smallModel)
        host.defaultModelOptions.smallModel = options.smallModel
    if (options.visionModel)
        host.defaultModelOptions.visionModel = options.visionModel

    logVerbose(
        `model: ${host.defaultModelOptions.model}, small model: ${host.defaultModelOptions.smallModel}, vision model: ${host.defaultModelOptions.visionModel}`
    )

    const scripts = await listTests({ ids, ...(options || {}) })
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
    const testDelay = normalizeInt(options?.testDelay)
    logInfo(`writing tests to ${out}`)

    if (options?.removeOut) await emptyDir(out)
    await ensureDir(out)
    await writeFile(provider, promptFooDriver)

    // Prepare test configurations for each script
    const configurations: { script: PromptScript; configuration: string }[] = []
    for (const script of scripts) {
        const fn = out
            ? join(out, `${script.id}.promptfoo.yaml`)
            : script.filename.replace(GENAI_ANY_REGEX, ".promptfoo.yaml")
        logInfo(`  ${fn}`)
        const { info } = await resolveModelConnectionInfo(script, {
            model: host.defaultModelOptions.model,
        })
        if (info.error) throw new Error(info.error)
        const config = generatePromptFooConfiguration(script, {
            out,
            cli,
            models: options.models?.map(parseModelSpec),
            provider: "provider.mjs",
            info,
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
    // Execute each configuration and gather results
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
        if (options.cache) args.push("--cache")
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
            value = JSON5TryParse(await readFile(outJson, "utf8"))

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

/*
 * Lists test scripts based on given options, filtering by IDs and groups.
 * @param options - Options to filter the test scripts by IDs or groups.
 * @returns A Promise resolving to an array of filtered scripts.
 */
async function listTests(options: { ids?: string[]; groups?: string[] }) {
    const { ids, groups } = options || {}
    const prj = await buildProject()
    const scripts = prj.templates
        .filter((t) => arrayify(t.tests)?.length)
        .filter((t) => !ids?.length || ids.includes(t.id))
        .filter((t) => tagFilter(groups, t.group))
    return scripts
}

/**
 * Executes prompt script tests and outputs the results, then exits the process with a status code.
 * @param ids - Array of script IDs to run tests on.
 * @param options - Options to configure the test run.
 */
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
        groups?: string[]
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

/**
 * Lists available test scripts, printing their IDs and filenames.
 * @param options - Options to filter the scripts by groups.
 */
export async function scriptTestList(options: { groups?: string[] }) {
    const scripts = await listTests(options)
    console.log(scripts.map((s) => toStringList(s.id, s.filename)).join("\n"))
}

/**
 * Launches a server to view promptfoo test results.
 * @param options - Options to specify the promptfoo version.
 */
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
