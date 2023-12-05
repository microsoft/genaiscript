import {
    FragmentTransformResponse,
    RequestError,
    clearToken,
    host,
    isRequestError,
    parseProject,
    runTemplate,
    setToken,
    writeJSON,
    writeText,
} from "coarch-core"
import { NodeHost } from "./hostimpl"
import { program } from "commander"
import { backOff } from "exponential-backoff"
import getStdin from "get-stdin"
import { basename, resolve } from "node:path"
import packageJson from "../package.json"

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
    const coarchJsonFiles = await host.findFiles("**/gptools.json")

    const newProject = await parseProject({
        gpspecFiles,
        gptoolFiles,
        coarchJsonFiles,
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
    }
) {
    const out = options.out
    const skipLLM = !!options.dryRun
    const retry = parseInt(options.retry) || 3
    const retryDelay = parseInt(options.retryDelay) || 5000
    const maxDelay = parseInt(options.maxDelay) || 180000
    const outTrace = options.outTrace

    let spec: string
    const toolFiles: string[] = []

    let md: string
    const links: string[] = []

    if (/.gptool\.js$/i.test(tool)) toolFiles.push(tool)

    const gpspecRx = /\.gpspec\.md$/i
    if (!specs?.length) {
        const specContent = await getStdin()
        spec = "stdin.gpspec.md"
        host.setVirtualFile(spec, specContent)
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
        host.setVirtualFile(
            spec,
            `${md || "# Specification"}

${links.map((f) => `-   [${basename(f)}](./${f})`).join("\n")}
`
        )
    }

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

    const res: FragmentTransformResponse = await backOff(
        async () =>
            await runTemplate(gptool, fragment, {
                infoCb: (progress) => {},
                skipLLM,
            }),
        {
            numOfAttempts: retry,
            startingDelay: retryDelay,
            maxDelay,
            retry: (e, attempt) => {
                if (isRequestError(e, 429)) {
                    console.error(`rate limited, retry #${attempt}...`)
                    return true
                }
                return false
            },
        }
    )

    if (outTrace && res.trace) await writeText(outTrace, res.trace)
    if (out) {
        const jsonf = /\.json$/i.test(out) ? out : out + ".json"
        const userf = jsonf.replace(/\.json$/i, ".user.md")
        const systemf = jsonf.replace(/\.json$/i, ".system.md")
        const outputf = jsonf.replace(/\.json$/i, ".output.md")
        const tracef = jsonf.replace(/\.json$/i, ".trace.md")
        console.log(
            `writing ${jsonf}, ${systemf}, ${userf}, ${outputf} and ${tracef}`
        )
        await writeJSON(jsonf, res)
        if (res.prompt) {
            await writeText(systemf, res.prompt.system)
            await writeText(userf, res.prompt.user)
        }
        if (res.text) await writeText(outputf, res.text)
        if (res.trace) await writeText(tracef, res.trace)
    } else {
        if (options.json) console.log(JSON.stringify(res, null, 2))
        if (options.dryRun) {
            const { system, user } = res.prompt || {}
            console.log(`---------- SYSTEM ----------`)
            console.log(system)
            console.log(`---------- USER   ----------`)
            console.log(user)
        } else console.log(res.text)
    }

    if (res.error) throw res.error
}

async function listTools() {
    const prj = await buildProject()
    prj.templates.forEach((t) =>
        console.log(
            `${t.id}: ${t.title}, ${t.filename || "builtin"}, ${
                t.isSystem ? "system" : "user"
            }"}`
        )
    )
}

async function listSpecs() {
    const prj = await buildProject()
    prj.rootFiles.forEach((f) => console.log(f.filename))
}

async function main() {
    process.on("uncaughtException", (err) => {
        console.error(err.message)
        console.error(err.stack)
        if (isRequestError(err)) process.exit((err as RequestError).status)
        process.exit(-1)
    })

    NodeHost.install()
    program
        .name("gptools")
        .version(packageJson.version)
        .description("CLI for GPTools https://github.com/microsoft/gptools")
        .showHelpAfterError(true)
    program
        .command("run")
        .description("Runs a GPTools against a GPSpec")
        .arguments("<tool> [spec...]")
        .option(
            "-o, --out <string>",
            "output file. Extra markdown fields for output and trace will also be generated"
        )
        .option("-ot, --out-trace <string>", "output file for trace")
        .option("-r, --retry <number>", "number of retries", "3")
        .option("-j, --json", "emit full JSON response to output")
        .option(
            "-d, --dry-run",
            "dry run, don't execute LLM and return expanded prompt"
        )
        .option(
            "-rd, --retry-delay <number>",
            "minimum delay between retries",
            "5000"
        )
        .option(
            "-md, --max-delay <number>",
            "maximum delay between retries",
            "180000"
        )
        .action(run)

    const keys = program.command("keys").description("Manage OpenAI keys")
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
    keys.command("set")
        .description("store OpenAI connection string in .gptools folder")
        .argument("<key>", "key to set")
        .action(async (tok) => {
            await setToken(tok)
        })
    keys.command("clear")
        .description("Clear any OpenAI connection string")
        .action(async () => await clearToken())

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

    program.parse()
}

main()
