import {
    FragmentTransformResponse,
    MarkdownTrace,
    RequestError,
    clip,
    createIssue,
    diagnosticsToCSV,
    host,
    isRequestError,
    logVerbose,
    parseGHTokenFromEnv,
    parseProject,
    readText,
    runTemplate,
    writeText,
} from "gptools-core"
import { NodeHost } from "./nodehost"
import { program } from "commander"
import getStdin from "get-stdin"
import { basename, resolve, join } from "node:path"
import packageJson from "../package.json"
import { error, isQuiet, setConsoleColors, setQuiet } from "./log"
import { ensureDir } from "fs-extra"

const UNHANDLED_ERROR_CODE = -1
const ANNOTATION_ERROR_CODE = -2

async function write(name: string, content: string) {
    logVerbose(`writing ${name}`)
    await writeText(name, content)
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

async function run(
    tool: string,
    specs: string[],
    options: {
        out: string
        retry: string
        retryDelay: string
        json: boolean
        maxDelay: string
        dryRun: boolean
        outTrace: string
        outAnnotations: string
        outChangelogs: string
        label: string
        temperature: string
        seed: string
        cache: boolean
        applyEdits: boolean
        model: string
        csvSeparator: string
        failOnErrors: boolean
        githubIssues: boolean
    }
) {
    const stream = !options.json
    const out = options.out
    const skipLLM = !!options.dryRun
    const retry = parseInt(options.retry) || 8
    const retryDelay = parseInt(options.retryDelay) || 15000
    const maxDelay = parseInt(options.maxDelay) || 180000
    const outTrace = options.outTrace
    const outAnnotations = options.outAnnotations
    const failOnErrors = options.failOnErrors
    const outChangelogs = options.outChangelogs
    const label = options.label
    const temperature = parseFloat(options.temperature) ?? undefined
    const seed = parseFloat(options.seed) ?? undefined
    const cache = !!options.cache
    const applyEdits = !!options.applyEdits
    const model = options.model
    const csvSeparator = options.csvSeparator || "\t"
    const githubIssues = options.githubIssues

    let spec: string
    let specContent: string
    const toolFiles: string[] = []

    let md: string
    const links: string[] = []

    if (/.gptool\.js$/i.test(tool)) toolFiles.push(tool)

    const gpspecRx = /\.gpspec\.md$/i
    if (!specs?.length) {
        specContent = await getStdin()
        spec = "stdin.gpspec.md"
    } else if (specs.length === 1 && gpspecRx.test(specs[0])) {
        spec = specs[0]
    } else {
        for (const arg of specs) {
            const files = await host.findFiles(arg)
            for (const file of files) {
                if (gpspecRx.test(spec)) {
                    md += (await host.readFile(file)) + "\n"
                } else {
                    links.push(file)
                }
            }
        }
    }

    if (md || links.length) {
        spec = "cli.gpspec.md"
        specContent = `${md || "# Specification"}

${links.map((f) => `-   [${basename(f)}](./${f})`).join("\n")}
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
                /\.gptool\.(js|ts)$/i.test(tool) &&
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
        infoCb: (progress) => {},
        partialCb: ({ responseChunk, tokensSoFar }) => {
            tokens = tokensSoFar
            if (stream) process.stdout.write(responseChunk)
            else if (!isQuiet) process.stderr.write(".")
        },
        skipLLM,
        label,
        cache,
        temperature: isNaN(temperature) ? undefined : temperature,
        seed: isNaN(seed) ? undefined : seed,
        model,
        retry,
        retryDelay,
        maxDelay,
    })
    ;(res as any).version = packageJson.version

    logVerbose(``)
    if (outTrace && res.trace) await write(outTrace, res.trace)
    if (outAnnotations && res.annotations?.length)
        await write(
            outAnnotations,
            /\.(c|t)sv$/i.test(outAnnotations)
                ? diagnosticsToCSV(res.annotations, csvSeparator)
                : JSON.stringify(res.annotations, null, 2)
        )
    if (outChangelogs && res.changelogs?.length)
        await write(outChangelogs, res.changelogs.join("\n"))

    if (applyEdits) {
        for (const fileEdit of Object.entries(res.fileEdits)) {
            const [fn, { before, after }] = fileEdit
            if (after !== before) await write(fn, after ?? before)
        }
    }

    if (out) {
        const jsonf = /\.json$/i.test(out) ? out : join(out, `res.json`)
        const mkfn = (ext: string) => jsonf.replace(/\.json$/i, ext)
        const userf = mkfn(".user.md")
        const systemf = mkfn(".system.md")
        const outputf = mkfn(".output.md")
        const tracef = mkfn(".trace.md")
        const annotationf = res.annotations?.length
            ? mkfn(".annotation.csv")
            : undefined
        const specf = specContent ? mkfn(".gpspec.md") : undefined
        const changelogf = res.changelogs?.length
            ? mkfn(".changelog.txt")
            : undefined
        await write(jsonf, JSON.stringify(res, null, 2))
        if (res.prompt) {
            await write(systemf, res.prompt.system)
            await write(userf, res.prompt.user)
        }
        if (res.text) await write(outputf, res.text)
        if (res.trace) await write(tracef, res.trace)
        if (specf) await write(specf, await readText(spec))
        if (annotationf)
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
        if (changelogf) await write(changelogf, res.changelogs.join("\n"))
    } else {
        if (options.json) console.log(JSON.stringify(res, null, 2))
        if (options.dryRun) {
            const { system, user } = res.prompt || {}
            console.log(`---------- SYSTEM ----------`)
            console.log(system)
            console.log(`---------- USER   ----------`)
            console.log(user)
        }
    }

    const errors = res.annotations?.filter((a) => a.severity === "error")
    if (githubIssues && errors?.length) {
        const conn = parseGHTokenFromEnv(process.env)
        for (const a of errors) {
            await createIssue(
                conn,
                `[gptools] ${a.message.split(".", 1)[0]} at ${a.filename}#L${
                    a.range[0][0]
                }`,
                `${a.message}

-  ${a.filename}#L${a.range[0][0]}

Error reported by gptools ${gptool.id}.
`
            )
        }
    }

    // final fail
    if (res.error) throw res.error
    if (failOnErrors && res.annotations?.some((a) => a.severity === "error")) {
        console.log`error annotations found, exiting with error code`
        process.exit(ANNOTATION_ERROR_CODE)
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

async function listSpecs() {
    const prj = await buildProject()
    prj.rootFiles.forEach((f) => console.log(f.filename))
}

async function convertToMarkdown(
    path: string,
    options: {
        out: string
    }
) {
    const { out } = options
    const trace = new MarkdownTrace()
    if (/^http?s:/i.test(path)) {
    } else {
        const files = await host.findFiles(path)
        if (out) await ensureDir(out)
        for (const file of files) {
            const outf = out ? join(out, basename(file) + ".md") : file + ".md"
            console.log(`converting ${file} -> ${outf}`)
            await clip(host, trace, file, outf)
        }
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
        .version(packageJson.version)
        .description("CLI for GPTools https://github.com/microsoft/gptools")
        .showHelpAfterError(true)
        .option("--no-colors", "disable color output")
        .option("-q, --quiet", "disable verbose output")

    program.on("option:no-colors", () => setConsoleColors(false))
    program.on("option:quiet", () => setQuiet(true))

    program
        .command("run")
        .description("Runs a GPTools against a GPSpec")
        .arguments("<tool> [spec...]")
        .option(
            "-o, --out <string>",
            "output file. Extra markdown fields for output and trace will also be generated"
        )
        .option("-ot, --out-trace <string>", "output file for trace")
        .option(
            "-oa, --out-annotations <string>",
            "output file for annotations (.csv will be rendered as csv)"
        )
        .option("-ocl, --out-changelog <string>", "output file for changelogs")
        .option("-j, --json", "emit full JSON response to output")
        .option(
            "-d, --dry-run",
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
        .option("-ghi, --github-issues", "create a github issues for errors")
        .option("-t, --temperature <number>", "temperature for the run")
        .option("-m, --model <string>", "model for the run")
        .option("-se, --seed <number>", "seed for the run")
        .option("-ae, --apply-edits", "apply file edits")
        .option("--no-cache", "disable LLM result cache")
        .option("--cs, --csv-separator <string>", "csv separator", "\t")
        .action(run)

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

    const specs = program.command("specs").description("Manage GPSpecs")
    specs
        .command("list", { isDefault: true })
        .description("List all available specs")
        .action(listSpecs)

    const converter = program
        .command("convert")
        .description("Convert HTML files or URLs to markdown format")
        .arguments("<path>")
        .option("-o, --out <string>", "output directory")
        .action(convertToMarkdown)

    program.parse()
}

main()
