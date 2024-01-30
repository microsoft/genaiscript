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
    writeJSONL,
    writeText,
} from "gptools-core"
import ora from "ora"
import { NodeHost } from "./nodehost"
import { Command, program } from "commander"
import getStdin from "get-stdin"
import { basename, resolve, join, relative, dirname } from "node:path"
import { error, isQuiet, setConsoleColors, setQuiet } from "./log"
import { createNodePath } from "./nodepath"
import { appendFile, writeFile } from "node:fs/promises"
import { mkdir } from "fs-extra"

const UNHANDLED_ERROR_CODE = -1
const ANNOTATION_ERROR_CODE = -2

async function write(name: string, content: string) {
    logVerbose(`writing ${name}`)
    await writeText(name, content)
}

async function appendJSONL<T>(name: string, objs: T[]) {
    logVerbose(`appending ${name}`)
    await writeJSONL(name, objs)
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
        out: string
        retry: string
        retryDelay: string
        maxDelay: string
        label: string
        temperature: string
        topP: string
        seed: string
        model: string
        cache: boolean
    }
) {
    const { out = "./results" } = options
    const outAnnotations = join(out, "annotations.jsonl")
    const outData = join(out, "data.jsonl")
    const outFenced = join(out, "fenced.jsonl")
    const outOutput = join(out, "output.md")
    const outErrors = join(out, "errors.jsonl")

    const spinner = ora("preparing tool and files").start()
    await initToken() // ensure we have a token early

    const retry = parseInt(options.retry) || 8
    const retryDelay = parseInt(options.retryDelay) || 15000
    const maxDelay = parseInt(options.maxDelay) || 180000
    const label = options.label
    const temperature = normalizeFloat(options.temperature)
    const topP = normalizeFloat(options.topP)
    const seed = normalizeFloat(options.seed)
    const model = options.model
    const cache = !!options.cache
    const path = createNodePath()

    const toolFiles: string[] = []
    if (gptoolRx.test(tool)) toolFiles.push(tool)
    const specFiles: string[] = []
    for (const arg of specs) {
        const ffs = await host.findFiles(arg)
        for (const f of ffs) {
            if (gpspecRx.test(f)) specFiles.push(f)
            else {
                const fp = `${f}.gpspec.md`
                const md = `# Specification
                
-   [${basename(f)}](./${basename(f)})\n`
                host.setVirtualFile(fp, md)
                specFiles.push(fp)
            }
        }
    }
    const prj = await buildProject({
        toolFiles,
        specFiles,
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
        `${spinner.text}, ${gptool.id} (${gptool.title}), ${specFiles.length} files`
    )

    await mkdir(out, { recursive: true })
    await writeFile(outOutput, `# Results\n\n`)
    for (const specFile of specFiles) {
        try {
            spinner.suffixText = ""
            spinner.start(specFile.replace(gpspecRx, ""))
            const fragment = prj.rootFiles.find(
                (f) => resolve(f.filename) === resolve(specFile)
            ).roots[0]
            let tokens = 0
            const res: FragmentTransformResponse = await runTemplate(
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
                }
            )
            // save results in various files
            if (res.error)
                await appendJSONL(outErrors, [
                    { tool, spec: specFile, error: res.error },
                ])
            // save results
            const outText = join(
                out,
                `${relative(".", specFile).replace(gpspecRx, ".md")}`
            )
            await mkdir(dirname(outText), { recursive: true })
            await writeFile(outText, res.text)

            await appendFile(
                outOutput,
                `- [${relative(".", specFile).replace(gpspecRx, "")}](${outText})\n`
            )
            if (res.annotations?.length)
                await appendJSONL(outAnnotations, res.annotations)
            if (res.fences?.length) await appendJSONL(outFenced, res.fences)
            if (res.frames?.length) await appendJSONL(outData, res.frames)

            if (res.error) spinner.fail(`${spinner.text}, ${res.error}`)
            else spinner.succeed()
        } catch (e) {
            await appendJSONL(outErrors, [
                { tool, spec: specFile, error: e.message + "\n" + e.stack },
            ])
            spinner.fail(`${spinner.text}, ${e.error}`)
        }
    }
}

function normalizeFloat(s: string) {
    const f = parseFloat(s)
    return isNaN(f) ? undefined : f
}

async function run(
    tool: string,
    specs: string[],
    options: {
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
    }
) {
    const stream = !options.json && !options.yaml
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

    let spec: string
    let specContent: string
    const toolFiles: string[] = []

    let md: string
    const files: string[] = []

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
                    files.push(file)
                }
            }
        }
    }

    if (md || files.length) {
        spec = "cli.gpspec.md"
        specContent = `${md || "# Specification"}

${files.map((f) => `-   [${basename(f)}](./${f})`).join("\n")}
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

    if (applyEdits) {
        for (const fileEdit of Object.entries(res.fileEdits)) {
            const [fn, { before, after }] = fileEdit
            if (after !== before) await write(fn, after ?? before)
        }
    }

    const promptjson = res.prompt?.length
        ? JSON.stringify(res.prompt, null, 2)
        : undefined
    if (out) {
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
        .arguments("<tool> [spec...]")
        .option(
            "-o, --out <string>",
            "output folder. Extra markdown fields for output and trace will also be generated"
        )
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
        .action(run)

    program
        .command("batch")
        .description("Run a tool on a batch of specs")
        .arguments("<tool> [spec...]")
        .option(
            "-o, --out <string>",
            "output folder. Extra markdown fields for output and trace will also be generated"
        )

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
