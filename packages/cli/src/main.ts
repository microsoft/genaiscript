import {
    FragmentTransformResponse,
    RequestError,
    YAMLStringify,
    coreVersion,
    diagnosticsToCSV,
    extractFenced,
    host,
    initToken,
    isJSONLFilename,
    isRequestError,
    logVerbose,
    parseProject,
    readText,
    runTemplate,
    appendJSONL as appendJSONLCore,
    writeText,
    MarkdownTrace,
    convertDiagnosticToGitHubActionCommand,
    readJSONL,
    dotGptoolsPath,
    parseKeyValuePairs,
    convertDiagnosticToAzureDevOpsCommand,
} from "gptools-core"
import ora from "ora"
import { NodeHost } from "./nodehost"
import { Command, program } from "commander"
import getStdin from "get-stdin"
import { basename, resolve, join, relative, dirname } from "node:path"
import { error, isQuiet, setConsoleColors, setQuiet } from "./log"
import { createNodePath } from "./nodepath"
import { appendFile, writeFile } from "node:fs/promises"
import { emptyDir, ensureDir } from "fs-extra"
import replaceExt from "replace-ext"

const UNHANDLED_ERROR_CODE = -1
const ANNOTATION_ERROR_CODE = -2
const FILES_NOT_FOUND = -3
const GENERATION_ERROR = -4

async function expandFiles(files: string[]) {
    const res: string[] = []
    for (const file of files) {
        const f = await host.findFiles(file)
        res.push(...f)
    }
    return res
}

async function write(name: string, content: string) {
    await writeText(name, content)
}

async function appendJSONL<T>(name: string, objs: T[], meta?: any) {
    if (meta)
        await appendJSONLCore(
            name,
            objs.map((obj) => ({ ...obj, __meta: meta }))
        )
    else await appendJSONLCore(name, objs)
}

async function buildProject(options?: {
    toolFiles?: string[]
    specFiles?: string[]
    toolsPath?: string
    specsPath?: string
}) {
    const {
        toolFiles,
        specFiles,
        toolsPath = "**/*.gptool.js",
        specsPath = "**/*.gpspec.md",
    } = options || {}

    const gpspecFiles = specFiles?.length
        ? specFiles
        : await host.findFiles(specsPath)
    const gptoolFiles = toolFiles?.length
        ? toolFiles
        : await host.findFiles(toolsPath)

    const newProject = await parseProject({
        gpspecFiles,
        gptoolFiles,
    })
    return newProject
}

const gpspecRx = /\.gpspec\.md$/i
const gptoolRx = /\.gptool\.js$/i
async function batch(
    tool: string,
    specs: string[],
    options: {
        excludedFiles: string[]
        out: string
        outSummary: string
        removeOut: boolean
        retry: string
        retryDelay: string
        maxDelay: string
        label: string
        temperature: string
        topP: string
        seed: string
        model: string
        cache: boolean
        applyEdits: boolean
        vars: string[]
    }
) {
    const spinner = ora({ interval: 200 }).start("preparing tool and files")

    const {
        out = dotGptoolsPath("results"),
        removeOut,
        model,
        cache,
        label,
        outSummary,
        applyEdits,
        excludedFiles,
        vars,
    } = options
    const outAnnotations = join(out, "annotations.jsonl")
    const outData = join(out, "data.jsonl")
    const outFenced = join(out, "fenced.jsonl")
    const outOutput = join(out, "output.md")
    const outErrors = join(out, "errors.jsonl")
    const outFileEdits = join(out, "file-edits.jsonl")

    const retry = parseInt(options.retry) || 12
    const retryDelay = parseInt(options.retryDelay) || 15000
    const maxDelay = parseInt(options.maxDelay) || 360000
    const temperature = normalizeFloat(options.temperature)
    const topP = normalizeFloat(options.topP)
    const seed = normalizeFloat(options.seed)
    const path = createNodePath()

    const toolFiles: string[] = []
    if (gptoolRx.test(tool)) toolFiles.push(tool)
    const specFiles = new Set<string>()
    for (const arg of specs) {
        const ffs = await host.findFiles(arg)
        for (const f of ffs) {
            if (gpspecRx.test(f)) specFiles.add(f)
            else {
                const fp = `${f}.gpspec.md`
                const md = `# Specification
                
-   [${basename(f)}](./${basename(f)})\n`
                host.setVirtualFile(fp, md)
                specFiles.add(fp)
            }
        }
    }

    if (excludedFiles?.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs) specFiles.delete(f)
        }
    }

    if (!specFiles.size) {
        spinner.fail("no file found")
        process.exit(FILES_NOT_FOUND)
    }

    const prj = await buildProject({
        toolFiles,
        specFiles: Array.from(specFiles),
    })
    const gptool = prj.templates.find(
        (t) =>
            t.id === tool ||
            (t.filename &&
                gptoolRx.test(tool) &&
                resolve(t.filename) === resolve(tool))
    )
    if (!gptool) throw new Error(`tool ${tool} not found`)

    spinner.succeed(
        `tool: ${gptool.id} (${gptool.title}), files: ${specFiles.size}, out: ${resolve(out)}`
    )

    spinner.start(`validating token`)
    const tok = await initToken() // ensure we have a token early
    spinner.succeed(`LLM: ${tok.url}`)

    let errors = 0
    let totalTokens = 0
    if (removeOut) await emptyDir(out)
    await ensureDir(out)
    for (let i = 0; i < prj.rootFiles.length; i++) {
        const specFile = prj.rootFiles[i].filename
        const file = specFile.replace(gpspecRx, "")
        const meta = { tool, file }
        try {
            spinner.suffixText = ""
            spinner.start(`${file} (${i + 1}/${specFiles.size})`)
            const fragment = prj.rootFiles.find(
                (f) => resolve(f.filename) === resolve(specFile)
            ).roots[0]
            let tokens = 0
            const result: FragmentTransformResponse = await runTemplate(
                gptool,
                fragment,
                {
                    infoCb: () => {},
                    partialCb: ({ tokensSoFar }) => {
                        tokens = tokensSoFar
                        spinner.suffixText = `${tokens} tokens`
                    },
                    skipLLM: false,
                    label,
                    cache,
                    temperature,
                    topP,
                    seed,
                    model,
                    retry,
                    retryDelay,
                    maxDelay,
                    path,
                    vars: parseVars(vars),
                }
            )

            const fileEdits = result.fileEdits || {}
            if (Object.keys(fileEdits).length) {
                if (applyEdits && !result.error) await writeFileEdits(result)
                // save results in various files
                await appendJSONL(
                    outFileEdits,
                    [{ fileEdits: result.fileEdits }],
                    meta
                )
            }
            if (result.error)
                await appendJSONL(outErrors, [{ error: result.error }], meta)
            if (result.annotations?.length)
                await appendJSONL(outAnnotations, result.annotations, meta)
            if (result.fences?.length)
                await appendJSONL(outFenced, result.fences, meta)
            if (result.frames?.length)
                await appendJSONL(outData, result.frames, meta)
            // add to summary
            if (outSummary) {
                const st = new MarkdownTrace()
                st.details(file, result.text)
                await appendFile(outSummary, st.content)
            }
            // save results
            const outText = join(
                out,
                `${relative(".", specFile).replace(gpspecRx, ".output.md")}`
            )
            const outTrace = join(
                out,
                `${relative(".", specFile).replace(gpspecRx, ".trace.md")}`
            )
            const outJSON = join(
                out,
                `${relative(".", specFile).replace(gpspecRx, ".json")}`
            )
            await ensureDir(dirname(outText))
            await writeFile(outText, result.text, { encoding: "utf8" })
            await writeFile(outTrace, result.trace, { encoding: "utf8" })
            await appendFile(
                outOutput,
                `- ${result.error ? "❌" : "✅"} [${relative(".", specFile).replace(gpspecRx, "")}](${relative(out, outText)}) ([trace](${relative(out, outTrace)}))\n`,
                { encoding: "utf8" }
            )
            await writeFile(outJSON, JSON.stringify(result, null, 2), {
                encoding: "utf8",
            })

            if (result.error) {
                errors++
                spinner.fail(`${spinner.text}, ${result.error}`)
            } else spinner.succeed()

            totalTokens += tokens

            // if in a CI/GitHub Actions build, print annotations
            if (
                result.annotations?.length &&
                process.env.CI &&
                process.env.GITHUB_ACTION
            )
                result.annotations
                    .map(convertDiagnosticToGitHubActionCommand)
                    .forEach((d) => console.log(d))
            else if (
                // Azure DevOps
                result.annotations?.length &&
                process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
            )
                result.annotations
                    .map(convertDiagnosticToAzureDevOpsCommand)
                    .forEach((d) => console.log(d))
        } catch (e) {
            errors++
            await appendJSONL(
                outErrors,
                [{ error: e.message + "\n" + e.stack }],
                meta
            )
            spinner.fail(`${spinner.text}, ${e.error}`)
        }
    }

    if (errors) process.exit(GENERATION_ERROR)
}

function normalizeFloat(s: string) {
    const f = parseFloat(s)
    return isNaN(f) ? undefined : f
}

function parseVars(vars: string[]) {
    if (!vars?.length) return undefined
    const res: Record<string, string> = {}
    if (vars) for (const v of vars) Object.assign(res, parseKeyValuePairs(v))
    return res
}

async function run(
    tool: string,
    specs: string[],
    options: {
        excludedFiles: string[]
        out: string
        retry: string
        retryDelay: string
        maxDelay: string
        json: boolean
        yaml: boolean
        prompt: boolean
        outTrace: string
        outAnnotations: string
        outChangelogs: string
        outData: string
        label: string
        temperature: string
        topP: string
        seed: string
        model: string
        csvSeparator: string
        cache: boolean
        applyEdits: boolean
        failOnErrors: boolean
        removeOut: boolean
        vars: string[]
    }
) {
    const excludedFiles = options.excludedFiles
    const stream = !options.json && !options.yaml && !options.out
    const out = options.out
    const skipLLM = !!options.prompt
    const retry = parseInt(options.retry) || 8
    const retryDelay = parseInt(options.retryDelay) || 15000
    const maxDelay = parseInt(options.maxDelay) || 180000
    const outTrace = options.outTrace
    const outAnnotations = options.outAnnotations
    const failOnErrors = options.failOnErrors
    const outChangelogs = options.outChangelogs
    const outData = options.outData
    const label = options.label
    const temperature = normalizeFloat(options.temperature)
    const topP = normalizeFloat(options.topP)
    const seed = normalizeFloat(options.seed)
    const cache = !!options.cache
    const applyEdits = !!options.applyEdits
    const model = options.model
    const csvSeparator = options.csvSeparator || "\t"
    const removeOut = options.removeOut
    const vars = options.vars

    let spec: string
    let specContent: string
    const toolFiles: string[] = []

    let md: string
    const files = new Set<string>()

    if (gptoolRx.test(tool)) toolFiles.push(tool)

    if (!specs?.length) {
        specContent = await getStdin()
        spec = "stdin.gpspec.md"
    } else if (specs.length === 1 && gpspecRx.test(specs[0])) {
        spec = specs[0]
    } else {
        for (const arg of specs) {
            const ffs = await host.findFiles(arg)
            for (const file of ffs) {
                if (gpspecRx.test(file)) {
                    md += (await host.readFile(file)) + "\n"
                } else {
                    files.add(file)
                }
            }
        }
    }

    if (excludedFiles?.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs) files.delete(f)
        }
    }

    if (md || files.size) {
        spec = "cli.gpspec.md"
        specContent = `${md || "# Specification"}

${Array.from(files)
    .map((f) => `-   [${basename(f)}](./${f})`)
    .join("\n")}
`
    }

    if (specContent) host.setVirtualFile(spec, specContent)

    const prj = await buildProject({
        toolFiles,
        specFiles: [spec],
    })
    const gptool = prj.templates.find(
        (t) =>
            t.id === tool ||
            (t.filename &&
                gptoolRx.test(tool) &&
                resolve(t.filename) === resolve(tool))
    )
    if (!gptool) throw new Error(`tool ${tool} not found`)
    const gpspec = prj.rootFiles.find(
        (f) => resolve(f.filename) === resolve(spec)
    )
    if (!gpspec) throw new Error(`spec ${spec} not found`)
    const fragment = gpspec.roots[0]

    let tokens = 0
    const res: FragmentTransformResponse = await runTemplate(gptool, fragment, {
        infoCb: () => {},
        partialCb: ({ responseChunk, tokensSoFar }) => {
            tokens = tokensSoFar
            if (stream) process.stdout.write(responseChunk)
            else if (!isQuiet) process.stderr.write(".")
        },
        skipLLM,
        label,
        cache,
        temperature,
        topP,
        seed,
        model,
        retry,
        retryDelay,
        maxDelay,
        path: createNodePath(),
        vars: parseVars(vars),
    })

    logVerbose(``)
    if (outTrace && res.trace) await write(outTrace, res.trace)
    if (outAnnotations && res.annotations?.length) {
        if (isJSONLFilename(outAnnotations))
            await appendJSONL(outAnnotations, res.annotations)
        else
            await write(
                outAnnotations,
                /\.(c|t)sv$/i.test(outAnnotations)
                    ? diagnosticsToCSV(res.annotations, csvSeparator)
                    : /\.ya?ml$/i.test(outAnnotations)
                      ? YAMLStringify(res.annotations)
                      : JSON.stringify(res.annotations, null, 2)
            )
    }
    if (outChangelogs && res.changelogs?.length)
        await write(outChangelogs, res.changelogs.join("\n"))
    if (outData && res.frames?.length)
        if (isJSONLFilename(outAnnotations))
            await appendJSONL(outData, res.frames)
        else await write(outData, JSON.stringify(res.frames, null, 2))

    if (applyEdits && !res.error && Object.keys(res.fileEdits || {}).length)
        await writeFileEdits(res)

    const promptjson = res.prompt?.length
        ? JSON.stringify(res.prompt, null, 2)
        : undefined
    if (out) {
        if (removeOut) await emptyDir(out)
        await ensureDir(out)

        const jsonf = /\.json$/i.test(out) ? out : join(out, `res.json`)
        const yamlf = /\.ya?ml$/i.test(out) ? out : join(out, `res.yaml`)
        const mkfn = (ext: string) => jsonf.replace(/\.json$/i, ext)
        const promptf = mkfn(".prompt.json")
        const outputf = mkfn(".output.md")
        const tracef = mkfn(".trace.md")
        const annotationf = res.annotations?.length
            ? mkfn(".annotations.csv")
            : undefined
        const specf = specContent ? mkfn(".gpspec.md") : undefined
        const changelogf = res.changelogs?.length
            ? mkfn(".changelog.txt")
            : undefined
        await write(jsonf, JSON.stringify(res, null, 2))
        await write(yamlf, YAMLStringify(res))
        if (promptjson) {
            await write(promptf, promptjson)
        }
        if (res.text) await write(outputf, res.text)
        if (res.trace) await write(tracef, res.trace)
        if (specf) {
            const spect = await readText(spec)
            await write(specf, spect)
        }
        if (annotationf && res.annotations?.length) {
            await write(
                annotationf,
                `severity, filename, start, end, message\n` +
                    res.annotations
                        .map(
                            ({ severity, filename, range, message }) =>
                                `${severity}, ${filename}, ${range[0][0]}, ${range[1][0]}, ${message} `
                        )
                        .join("\n")
            )
        }
        if (changelogf && res.changelogs?.length)
            await write(changelogf, res.changelogs.join("\n"))
    } else {
        if (options.json) console.log(JSON.stringify(res, null, 2))
        if (options.yaml) console.log(YAMLStringify(res))
        if (options.prompt && promptjson) {
            console.log(promptjson)
        }
    }

    // final fail
    if (res.error) {
        logVerbose(`error: ${res.error}`)
        process.exit(ANNOTATION_ERROR_CODE)
    }

    if (failOnErrors && res.annotations?.some((a) => a.severity === "error")) {
        console.log`error annotations found, exiting with error code`
        process.exit(ANNOTATION_ERROR_CODE)
    }
    logVerbose(`gptools run completed with ${tokens} tokens`)
}

async function writeFileEdits(res: FragmentTransformResponse) {
    for (const fileEdit of Object.entries(res.fileEdits)) {
        const [fn, { before, after }] = fileEdit
        if (after !== before) await write(fn, after ?? before)
    }
}

async function listTools() {
    const prj = await buildProject()
    prj.templates.forEach((t) =>
        console.log(
            `${t.id}: ${t.title}, ${t.filename || "builtin"}, ${
                t.isSystem ? "system" : "user"
            }`
        )
    )
}

async function helpAll() {
    console.log(`# GPTools CLI\n`)

    const visit = (
        header: string,
        parent: Command,
        commands: readonly Command[]
    ) => {
        commands.forEach((c) => {
            console.log(
                `\n${header} \`${parent ? parent.name() : ""} ${c.name()}\`\n`
            )
            c.outputHelp()
            if (c.commands?.length) {
                console.log(`\n${header + "#"} Subcommands\n`)
                visit(header + "##", c, c.commands)
            }
        })
    }
    visit("##", undefined, program.commands)
}

async function parseFence(language: string) {
    const stdin = await getStdin()
    const fences = extractFenced(stdin || "").filter(
        (f) => f.language === language
    )
    console.log(fences.map((f) => f.content).join("\n\n"))
}

async function jsonl2json(files: string[]) {
    const spinner = ora({ interval: 200 })
    for (const file of await expandFiles(files)) {
        spinner.suffixText = ""
        spinner.start(file)
        if (!isJSONLFilename(file)) {
            spinner.suffixText = "not a jsonl file"
            spinner.fail()
            continue
        }
        const objs = await readJSONL(file)
        const out = replaceExt(file, ".json")
        await write(out, JSON.stringify(objs, null, 2))
        spinner.succeed()
    }
}

async function main() {
    process.on("uncaughtException", (err) => {
        error(isQuiet ? err : err.message)
        if (isRequestError(err)) {
            const exitCode = (err as RequestError).status
            process.exit(exitCode)
        } else process.exit(UNHANDLED_ERROR_CODE)
    })

    NodeHost.install()
    program
        .name("gptools")
        .version(coreVersion)
        .description("CLI for GPTools https://github.com/microsoft/gptools")
        .showHelpAfterError(true)
        .option("--no-colors", "disable color output")
        .option("-q, --quiet", "disable verbose output")

    program.on("option:no-colors", () => setConsoleColors(false))
    program.on("option:quiet", () => setQuiet(true))

    program
        .command("run")
        .description("Runs a GPTools against files or stdin.")
        .arguments("<tool> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option(
            "-o, --out <string>",
            "output folder. Extra markdown fields for output and trace will also be generated"
        )
        .option("-rmo, --remove-out", "remove output folder if it exists")
        .option("-ot, --out-trace <string>", "output file for trace")
        .option(
            "-od, --out-data <string>",
            "output file for data (.jsonl/ndjson will be aggregated). JSON schema information and validation will be included if available."
        )
        .option(
            "-oa, --out-annotations <string>",
            "output file for annotations (.csv will be rendered as csv, .jsonl/ndjson will be aggregated)"
        )
        .option("-ocl, --out-changelog <string>", "output file for changelogs")
        .option("-j, --json", "emit full JSON response to output")
        .option("-y, --yaml", "emit full YAML response to output")
        .option(
            "-p, --prompt",
            "dry run, don't execute LLM and return expanded prompt"
        )
        .option(`-fe, --fail-on-errors`, `fails on detected annotation error`)
        .option("-r, --retry <number>", "number of retries", "8")
        .option(
            "-rd, --retry-delay <number>",
            "minimum delay between retries",
            "15000"
        )
        .option(
            "-md, --max-delay <number>",
            "maximum delay between retries",
            "180000"
        )
        .option("-l, --label <string>", "label for the run")
        .option("-t, --temperature <number>", "temperature for the run")
        .option("-tp, --top-p <number>", "top-p for the run")
        .option("-m, --model <string>", "model for the run")
        .option("-se, --seed <number>", "seed for the run")
        .option("--no-cache", "disable LLM result cache")
        .option("--cs, --csv-separator <string>", "csv separator", "\t")
        .option("-ae, --apply-edits", "apply file edits")
        .option(
            "--vars <namevalue...>",
            "variables, as name=value, stored in env.vars"
        )
        .action(run)

    program
        .command("batch")
        .description("Run a tool on a batch of specs")
        .arguments("<tool> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option(
            "-o, --out <folder>",
            "output folder. Extra markdown fields for output and trace will also be generated"
        )
        .option("-rmo, --remove-out", "remove output folder if it exists")
        .option("-os, --out-summary <file>", "append output summary in file")
        .option("-r, --retry <number>", "number of retries", "8")
        .option(
            "-rd, --retry-delay <number>",
            "minimum delay between retries",
            "15000"
        )
        .option(
            "-md, --max-delay <number>",
            "maximum delay between retries",
            "180000"
        )
        .option("-l, --label <string>", "label for the run")
        .option("-t, --temperature <number>", "temperature for the run")
        .option("-tp, --top-p <number>", "top-p for the run")
        .option("-m, --model <string>", "model for the run")
        .option("-se, --seed <number>", "seed for the run")
        .option("--no-cache", "disable LLM result cache")
        .option("-ae, --apply-edits", "apply file edits")
        .option(
            "--vars <string...>",
            "variables, as name=value, stored in env.vars"
        )
        .action(batch)

    const keys = program
        .command("keys")
        .description("Manage OpenAI keys")
        .addHelpText(
            "after",
            `The OpenAI configuration keys can be set in various ways:

-   set the GPTOOLS_TOKEN environment variable. The format is 'https://base-url#key=secret-token'
-   set the OPENAI_API_BASE, OPENAI_API_KEY environment variables. OPENAI_API_TYPE is optional or must be 'azure' and OPENAI_API_VERSION is optional or must be '2023-03-15-preview'.
-   '.env' file with the same variables
`
        )
    keys.command("show", { isDefault: true })
        .description("Parse and show current key information")
        .action(async () => {
            const key = await host.getSecretToken()
            console.log(
                key
                    ? `${
                          key.isOpenAI ? "OpenAI" : key.isTGI ? "TGI" : key.url
                      } (from ${key.source})`
                    : "no key set"
            )
        })

    const tools = program.command("tools").description("Manage GPTools")
    tools
        .command("list", { isDefault: true })
        .description("List all available tools")
        .action(listTools)

    program
        .command("jsonl2json", "Converts JSONL files to a JSON file")
        .argument("<file...>", "input JSONL files")
        .action(jsonl2json)

    const parser = program
        .command("parse")
        .description("Parse output of a GPSpec in various formats")
    parser
        .command("region <language>")
        .description("Extracts a code fenced regions of the given type")
        .action(parseFence)

    program
        .command("help-all", { hidden: true })
        .description("Show help for all commands")
        .action(helpAll)

    program.parse()
}

main()
