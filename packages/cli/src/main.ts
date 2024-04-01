import {
    FragmentTransformResponse,
    RequestError,
    YAMLStringify,
    CORE_VERSION,
    extractFenced,
    host,
    isJSONLFilename,
    isRequestError,
    readText,
    runTemplate,
    writeText,
    MarkdownTrace,
    convertDiagnosticToGitHubActionCommand,
    readJSONL,
    convertDiagnosticToAzureDevOpsCommand,
    dotGenaiscriptPath,
    upsert,
    Progress,
    search,
    TOOL_ID,
    TOOL_NAME,
    GITHUB_REPO,
    clearIndex,
    PDFTryParse,
    SERVER_PORT,
    isHighlightSupported,
    loadFiles,
    outline,
    estimateTokens,
    assert,
    DOCXTryParse,
    isCancelError,
    normalizeInt,
    normalizeFloat,
    GENAI_JS_REGEX,
    GPSPEC_REGEX,
    FILES_NOT_FOUND_ERROR_CODE,
    RUNTIME_ERROR_CODE,
    UNHANDLED_ERROR_CODE,
    GENERATION_ERROR_CODE,
    appendJSONL,
    writeFileEdits,
    parseVars,
} from "genaiscript-core"
import ora, { Ora } from "ora"
import { NodeHost } from "./nodehost"
import { Command, program } from "commander"
import getStdin from "get-stdin"
import { basename, resolve, join, relative, dirname } from "node:path"
import { error, isQuiet, setConsoleColors, setQuiet } from "./log"
import { appendFile, writeFile } from "node:fs/promises"
import { emptyDir, ensureDir } from "fs-extra"
import replaceExt from "replace-ext"
import { startServer } from "./server"
import { satisfies as semverSatisfies } from "semver"
import { NODE_MIN_VERSION } from "./version"
import { runScript } from "./run"
import { buildProject } from "./build"

class ProgressSpinner implements Progress {
    constructor(readonly spinner: Ora) {}
    report(value: {
        message?: string
        increment?: number
        succeeded?: boolean
    }): void {
        const { message, succeeded } = value
        if (succeeded === true) {
            this.spinner.succeed(message)
        } else if (succeeded === false) {
            this.spinner.fail(message)
        } else if (message) this.spinner.start(message)
    }
}

async function expandFiles(files: string[], excludedFiles?: string[]) {
    const res = new Set<string>()
    for (const file of files) {
        const fs = await host.findFiles(file)
        for (const f of fs) res.add(f)
    }

    if (excludedFiles?.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs) {
                res.delete(f)
            }
        }
    }

    return Array.from(res.values())
}

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
        maxTokens: string
        model: string
        cache: boolean
        applyEdits: boolean
        vars: string[]
    }
) {
    const spinner = ora({ interval: 200 }).start("preparing tool and files")

    const {
        out = dotGenaiscriptPath("results"),
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

    const retry = normalizeInt(options.retry) || 12
    const retryDelay = normalizeInt(options.retryDelay) || 15000
    const maxDelay = normalizeInt(options.maxDelay) || 360000
    const temperature = normalizeFloat(options.temperature)
    const topP = normalizeFloat(options.topP)
    const seed = normalizeFloat(options.seed)
    const maxTokens = normalizeInt(options.maxTokens)

    const toolFiles: string[] = []
    if (GENAI_JS_REGEX.test(tool)) toolFiles.push(tool)
    const specFiles = new Set<string>()
    for (const arg of specs) {
        const ffs = await host.findFiles(arg)
        for (const f of ffs) {
            if (GPSPEC_REGEX.test(f)) specFiles.add(f)
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
        process.exit(FILES_NOT_FOUND_ERROR_CODE)
    }

    const prj = await buildProject({
        toolFiles,
        specFiles: Array.from(specFiles),
    })
    const script = prj.templates.find(
        (t) =>
            t.id === tool ||
            (t.filename &&
                GENAI_JS_REGEX.test(tool) &&
                resolve(t.filename) === resolve(tool))
    )
    if (!script) throw new Error(`tool ${tool} not found`)

    spinner.succeed(
        `tool: ${script.id} (${script.title}), files: ${specFiles.size}, out: ${resolve(out)}`
    )

    let errors = 0
    let totalTokens = 0
    if (removeOut) await emptyDir(out)
    await ensureDir(out)
    for (let i = 0; i < prj.rootFiles.length; i++) {
        const specFile = prj.rootFiles[i].filename
        const file = specFile.replace(GPSPEC_REGEX, "")
        const meta = { tool, file }
        try {
            spinner.suffixText = ""
            spinner.start(`${file} (${i + 1}/${specFiles.size})`)
            const fragment = prj.rootFiles.find(
                (f) => resolve(f.filename) === resolve(specFile)
            ).fragments[0]
            assert(fragment !== undefined, `${specFile} not found`)
            let tokens = 0
            const result: FragmentTransformResponse = await runTemplate(
                script,
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
                    maxTokens,
                    model,
                    retry,
                    retryDelay,
                    maxDelay,
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
                `${relative(".", specFile).replace(GPSPEC_REGEX, ".output.md")}`
            )
            const outTrace = join(
                out,
                `${relative(".", specFile).replace(GPSPEC_REGEX, ".trace.md")}`
            )
            const outJSON = join(
                out,
                `${relative(".", specFile).replace(GPSPEC_REGEX, ".json")}`
            )
            await ensureDir(dirname(outText))
            await writeFile(outText, result.text, { encoding: "utf8" })
            await writeFile(outTrace, result.trace, { encoding: "utf8" })
            await appendFile(
                outOutput,
                `- ${result.error ? (isCancelError(result.error as any) ? "⚠" : "❌") : "✅"} [${relative(".", specFile).replace(GPSPEC_REGEX, "")}](${relative(out, outText)}) ([trace](${relative(out, outTrace)}))\n`,
                { encoding: "utf8" }
            )
            await writeFile(outJSON, JSON.stringify(result, null, 2), {
                encoding: "utf8",
            })

            if (result.error) {
                if (isCancelError(result.error as Error))
                    spinner.warn(
                        `${spinner.text}, cancelled, ${(result.error as Error).message || result.error}`
                    )
                else {
                    errors++
                    spinner.fail(
                        `${spinner.text}, ${(result.error as Error).message || result.error}`
                    )
                }
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

    if (errors) process.exit(GENERATION_ERROR_CODE)
}

async function listScripts() {
    const prj = await buildProject()
    prj.templates.forEach((t) =>
        console.log(
            `${t.id}, ${t.title}, ${t.filename || "builtin"}, ${
                t.isSystem ? "system" : "user"
            }`
        )
    )
}

async function helpAll() {
    console.log(`---`)
    console.log(`title: Commands`)
    console.log(`sidebar:`)
    console.log(`  order: 100`)
    console.log(`---\n`)

    console.log(`<!-- autogenerated, do not edit -->`)
    console.log(`A full list of the CLI command and its respective help text.`)

    const visit = (
        header: string,
        parent: Command,
        commands: readonly Command[]
    ) => {
        commands.forEach((c) => {
            if (c.name() === "help-all") return
            console.log(
                `\n${header} \`${[parent?.name(), c.name()].filter((c) => c).join(" ")}\`\n`
            )
            console.log("```")
            c.outputHelp()
            console.log("```")
            if (c.commands?.length) {
                visit(header + "#", c, c.commands)
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

async function parsePDF(file: string) {
    const pages = await PDFTryParse(file)
    const out = YAMLStringify(pages)
    console.log(out)
}

async function parseDOCX(file: string) {
    const text = await DOCXTryParse(file)
    console.log(text)
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
        await writeText(out, JSON.stringify(objs, null, 2))
        spinner.succeed()
    }
}

async function retreivalIndex(
    files: string[],
    options: {
        excludedFiles: string[]
        summary: boolean
        name: string
        model: string
        chunkSize: string
        chunkOverlap: string
        splitLongSentences: boolean
    }
) {
    const {
        excludedFiles,
        name: indexName,
        model,
        chunkOverlap,
        chunkSize,
        splitLongSentences,
        summary,
    } = options || {}
    const fs = await expandFiles(files, excludedFiles)
    if (!fs.length) {
        console.error("no files matching")
        return
    }

    const spinner = ora({ interval: 200 }).start(`indexing ${fs.length} files`)
    await upsert(fs, {
        progress: new ProgressSpinner(spinner),
        indexName,
        model,
        chunkOverlap: normalizeInt(chunkOverlap),
        chunkSize: normalizeInt(chunkSize),
        splitLongSentences,
        summary,
    })
    spinner.stop()
}

async function retreivalClear(options: { name: string; summary: boolean }) {
    const { name: indexName, summary } = options || {}
    await clearIndex({ indexName, summary })
}

async function retreivalSearch(
    q: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        topK: string
        name: string
        summary: boolean
    }
) {
    const { excludedFiles, name: indexName, topK, summary } = options || {}
    const files = await expandFiles(filesGlobs, excludedFiles)
    const spinner = ora({ interval: 200 }).start(
        `searching '${q}' in ${files.length} files`
    )
    const res = await search(q, {
        files,
        topK: normalizeInt(topK),
        indexName,
        summary,
    })
    spinner.succeed()
    console.log(YAMLStringify(res))
}

async function codeOutline(
    fileGlobs: string[],
    options: { excludedFiles: string[] }
) {
    const files = await loadFiles(
        (await expandFiles(fileGlobs, options.excludedFiles)).filter(
            isHighlightSupported
        )
    )
    const res = await outline(files)
    console.log(res?.response || "")
}

async function retreivalTokens(
    filesGlobs: string[],
    options: { excludedFiles: string[]; model: string }
) {
    const { model = "gpt4" } = options || {}

    const print = (file: string, content: string) =>
        console.log(
            `${file}, ${content.length} chars, ${estimateTokens(model, content)} tokens`
        )

    const files = await expandFiles(filesGlobs, options?.excludedFiles)
    let text = ""
    for (const file of files) {
        const content = await readText(file)
        if (content) {
            print(file, content)
            text += content
        }
    }
    print("total", text)
}
async function main() {
    process.on("uncaughtException", (err) => {
        error(isQuiet ? err : err.message)
        if (isRequestError(err)) {
            const exitCode = (err as RequestError).status
            process.exit(exitCode)
        } else process.exit(UNHANDLED_ERROR_CODE)
    })

    if (!semverSatisfies(process.version, NODE_MIN_VERSION)) {
        console.error(
            `node.js runtime incompatible, expected ${NODE_MIN_VERSION} got ${process.version}`
        )
        process.exit(RUNTIME_ERROR_CODE)
    }

    program.hook("preAction", (cmd) => {
        NodeHost.install(cmd.opts().env)
    })

    program
        .name(TOOL_ID)
        .version(CORE_VERSION)
        .description(`CLI for ${TOOL_NAME} ${GITHUB_REPO}`)
        .showHelpAfterError(true)
        .option("--env <path>", "path to .env file, default is './.env'")
        .option("--no-colors", "disable color output")
        .option("-q, --quiet", "disable verbose output")
    program.on("option:no-colors", () => setConsoleColors(false))
    program.on("option:quiet", () => setQuiet(true))

    program
        .command("run")
        .description("Runs a GenAIScript against files or stdin.")
        .arguments("<script> [files...]")
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
        .option("-mt, --max-tokens <number>", "maximum tokens for the run")
        .option("-se, --seed <number>", "seed for the run")
        .option("--no-cache", "disable LLM result cache")
        .option("--cs, --csv-separator <string>", "csv separator", "\t")
        .option("-ae, --apply-edits", "apply file edits")
        .option(
            "--vars <namevalue...>",
            "variables, as name=value, stored in env.vars"
        )
        .action(runScript)

    program
        .command("batch")
        .description("Run a tool on a batch of specs")
        .arguments("<script> [files...]")
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
        .option("-mt, --max-tokens <number>", "maximum tokens for the run")
        .option("-se, --seed <number>", "seed for the run")
        .option("--no-cache", "disable LLM result cache")
        .option("-ae, --apply-edits", "apply file edits")
        .option(
            "--vars <string...>",
            "variables, as name=value, stored in env.vars"
        )
        .action(batch)

    program
        .command("scripts")
        .description("List all available scripts in workspace")
        .action(listScripts)

    const retreival = program.command("retreival").description("RAG support")
    retreival
        .command("index")
        .description("Index a set of documents")
        .argument("<file...>", "Files to index")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option("-n, --name <string>", "index name")
        //        .option("-s, --summary", "use LLM-generated summaries")
        .option("-cs, --chunk-size <number>", "chunk size")
        .option("-co, --chunk-overlap <number>", "chunk overlap")
        .option("-m, --model <string>", "model for embeddings (default gpt-4)")
        .option(
            "-sls, --split-long-sentences",
            "split long sentences (default true)"
        )
        .action(retreivalIndex)
    retreival
        .command("search")
        .description("Search index")
        .arguments("<query> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option("-tk, --top-k <number>", "maximum number of embeddings")
        .option("-n, --name <string>", "index name")
        //        .option("-s, --summary", "use LLM-generated summaries")
        .action(retreivalSearch)
    retreival
        .command("clear")
        .description("Clear index to force re-indexing")
        .option("-n, --name <string>", "index name")
        //        .option("-s, --summary", "use LLM-generated summaries")
        .action(retreivalClear)

    retreival
        .command("outline")
        .description("Generates a compact code repository outline")
        .arguments("<files...>")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .action(codeOutline)

    program
        .command("serve")
        .description("Start a GenAIScript local server")
        .option(
            "-p, --port <number>",
            `Specify the port number, default: ${SERVER_PORT}`
        )
        .action(startServer)

    const parser = program.command("parse").description("Parse various outputs")
    parser
        .command("fence <language>")
        .description("Extracts a code fenced regions of the given type")
        .action(parseFence)

    parser
        .command("pdf <file>")
        .description("Parse a PDF into text")
        .action(parsePDF)

    parser
        .command("docx <file>")
        .description("Parse a DOCX into texts")
        .action(parseDOCX)
    parser
        .command("tokens")
        .description("Count tokens in a set of files")
        .arguments("<files...>")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .action(retreivalTokens)
    parser
        .command("jsonl2json", "Converts JSONL files to a JSON file")
        .argument("<file...>", "input JSONL files")
        .action(jsonl2json)

    program
        .command("help-all", { hidden: true })
        .description("Show help for all commands")
        .action(helpAll)

    program.parse()
}

main()
