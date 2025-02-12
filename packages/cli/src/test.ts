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
    TEST_RUNS_DIR_NAME,
    PROMPTFOO_REMOTE_API_PORT,
    PROMPTFOO_TEST_MAX_CONCURRENCY,
} from "../../core/src/constants"
import { promptFooDriver } from "../../core/src/default_prompts"
import { serializeError } from "../../core/src/error"
import { runtimeHost } from "../../core/src/host"
import { JSON5TryParse } from "../../core/src/json5"
import { MarkdownTrace } from "../../core/src/trace"
import {
    logInfo,
    logVerbose,
    toStringList,
    dotGenaiscriptPath,
} from "../../core/src/util"
import { YAMLStringify } from "../../core/src/yaml"
import {
    PromptScriptTestRunOptions,
    PromptScriptTestRunResponse,
    PromptScriptTestResult,
} from "../../core/src/server/messages"
import { generatePromptFooConfiguration } from "../../core/src/promptfoo"
import { delay } from "es-toolkit"
import { resolveModelConnectionInfo } from "../../core/src/models"
import { filterScripts } from "../../core/src/ast"
import { link } from "../../core/src/mkmd"
import { applyModelOptions } from "./modelalias"
import { normalizeFloat, normalizeInt } from "../../core/src/cleaners"
import { ChatCompletionReasoningEffort } from "../../core/src/chattypes"
import {
    CancellationOptions,
    checkCancelled,
} from "../../core/src/cancellation"
import { CORE_VERSION } from "../../core/src/version"
import {
    headersToMarkdownTableHead,
    headersToMarkdownTableSeperator,
    objectToMarkdownTableRow,
} from "../../core/src/csv"

/**
 * Parses model specifications from a string and returns a ModelOptions object.
 * @param m - The string representation of the model specification.
 * @returns A ModelOptions object with model, temperature, and topP fields if applicable.
 */
function parseModelSpec(m: string): ModelOptions & ModelAliasesOptions {
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
            reasoningEffort: values["r"] as ChatCompletionReasoningEffort,
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
        PROMPTFOO_DISABLE_TELEMETRY: env.PROMPTFOO_DISABLE_TELEMETRY ?? "true",
        PROMPTFOO_DISABLE_UPDATE: env.PROMPTFOO_DISABLE_UPDATE ?? "true",
        PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION:
            env.PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION ?? "true",
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
        redteam?: boolean
        promptfooVersion?: string
        outSummary?: string
        testDelay?: string
    } & CancellationOptions
): Promise<PromptScriptTestRunResponse> {
    applyModelOptions(options, "cli")
    const { cancellationToken, redteam } = options || {}
    const scripts = await listTests({ ids, ...(options || {}) })
    if (!scripts.length)
        return {
            ok: false,
            status: FILES_NOT_FOUND_ERROR_CODE,
            error: serializeError(new Error("no tests found")),
        }

    const cli = options.cli || resolve(__filename)
    const out = options.out || join(GENAISCRIPT_FOLDER, "tests")
    let outSummary = options.outSummary
        ? resolve(options.outSummary)
        : undefined
    const provider = join(out, "provider.mjs")
    const port = PROMPTFOO_REMOTE_API_PORT
    const serverUrl = `http://127.0.0.1:${port}`
    const testDelay = normalizeInt(options?.testDelay)
    logInfo(`writing tests to ${out}`)

    if (options?.removeOut) await emptyDir(out)
    await ensureDir(out)
    await writeFile(provider, promptFooDriver)

    if (!outSummary) {
        outSummary = dotGenaiscriptPath(
            TEST_RUNS_DIR_NAME,
            `${new Date().toISOString().replace(/[:.]/g, "-")}.trace.md`
        )
    }

    await ensureDir(PROMPTFOO_CACHE_PATH)
    await ensureDir(PROMPTFOO_CONFIG_DIR)
    if (outSummary) {
        await ensureDir(dirname(outSummary))
        await appendFile(
            outSummary,
            `## GenAIScript Test Results

- Run this command to launch the promptfoo test viewer.

\`\`\`sh
npx --yes genaiscript@${CORE_VERSION} test view
\`\`\`

`
        )
        logVerbose(`trace: ${outSummary}`)
    }

    // Prepare test configurations for each script
    const configurations: { script: PromptScript; configuration: string }[] = []
    for (const script of scripts) {
        checkCancelled(cancellationToken)
        const fn = out
            ? join(out, `${script.id}.promptfoo.yaml`)
            : script.filename.replace(GENAI_ANY_REGEX, ".promptfoo.yaml")
        logInfo(`  ${fn}`)
        const { info: chatInfo } = await resolveModelConnectionInfo(script, {
            model: runtimeHost.modelAliases.large.model,
        })
        if (chatInfo.error) throw new Error(chatInfo.error)
        let { info: embeddingsInfo } = await resolveModelConnectionInfo(
            script,
            { model: runtimeHost.modelAliases.embeddings.model }
        )
        if (embeddingsInfo?.error) embeddingsInfo = undefined
        const config = await generatePromptFooConfiguration(script, {
            out,
            cli,
            models: options.models?.map(parseModelSpec),
            provider: "provider.mjs",
            chatInfo,
            embeddingsInfo,
            redteam,
        })
        const yaml = YAMLStringify(config)
        await writeFile(fn, yaml)
        configurations.push({ script, configuration: fn })
    }

    let stats = {
        prompt: 0,
        completion: 0,
        total: 0,
    }
    const headers = ["status", "script", "prompt", "completion", "total", "url"]
    if (outSummary) {
        await appendFile(
            outSummary,
            [
                headersToMarkdownTableHead(headers),
                headersToMarkdownTableSeperator(headers),
            ].join("")
        )
    }
    const promptFooVersion = options.promptfooVersion || PROMPTFOO_VERSION
    const results: PromptScriptTestResult[] = []
    // Execute each configuration and gather results
    for (const config of configurations) {
        checkCancelled(cancellationToken)
        const { script, configuration } = config
        const outJson = configuration.replace(/\.yaml$/, ".res.json")
        const cmd = "npx"
        const args = ["--yes", `promptfoo@${promptFooVersion}`]
        if (redteam) args.push("redteam", "run", "--force")
        else args.push("eval", "--no-progress-bar")
        args.push(
            "--config",
            configuration,
            "--max-concurrency",
            String(PROMPTFOO_TEST_MAX_CONCURRENCY)
        )
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
        let value: PromptScriptTestResult["value"] = undefined
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
        stats.prompt += value?.results?.stats?.tokenUsage?.prompt || 0
        stats.completion += value?.results?.stats?.tokenUsage?.completion || 0
        stats.total += value?.results?.stats?.tokenUsage?.total || 0
        if (outSummary) {
            const url = value?.evalId
                ? " " +
                  link(
                      "result",
                      `${serverUrl}/eval?evalId=${encodeURIComponent(value?.evalId)}`
                  ) +
                  " "
                : ""
            const row = {
                status: ok ? EMOJI_SUCCESS : EMOJI_FAIL,
                script: script.id,
                prompt: value?.results?.stats?.tokenUsage?.prompt,
                completion: value?.results?.stats?.tokenUsage?.completion,
                total: value?.results?.stats?.tokenUsage?.total,
                url,
            }
            await appendFile(
                outSummary,
                objectToMarkdownTableRow(
                    {
                        status: ok ? EMOJI_SUCCESS : EMOJI_FAIL,
                        script: script.id,
                        prompt: value?.results?.stats?.tokenUsage?.prompt,
                        completion:
                            value?.results?.stats?.tokenUsage?.completion,
                        total: value?.results?.stats?.tokenUsage?.total,
                        url,
                    },
                    headers,
                    { skipEscape: true }
                )
            )
        }
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

    if (outSummary) {
        await appendFile(
            outSummary,
            [
                headersToMarkdownTableHead(headers),
                objectToMarkdownTableRow(
                    {
                        status: results.filter((r) => r.ok).length,
                        prompt: stats.prompt,
                        completion: stats.completion,
                        total: stats.total,
                    },
                    headers,
                    { skipEscape: true }
                ),
                "\n\n",
            ].join("")
        )
    }
    if (outSummary) logVerbose(`trace: ${outSummary}`)
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
async function listTests(options: {
    ids?: string[]
    groups?: string[]
    redteam?: boolean
}) {
    const prj = await buildProject()
    const scripts = filterScripts(prj.scripts, {
        ...(options || {}),
        test: options.redteam ? undefined : true,
        redteam: options.redteam,
    })
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
        redteam?: boolean
        promptfooVersion?: string
        outSummary?: string
        testDelay?: string
        groups?: string[]
    }
) {
    const { status, value = [] } = await runPromptScriptTests(ids, options)
    const trace = new MarkdownTrace()
    trace.appendContent(
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
export async function scriptTestList(options: {
    groups?: string[]
    redteam?: boolean
}) {
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
