import {
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

async function buildProject(options?: {
    toolsPath?: string
    specsPath?: string
}) {
    const { toolsPath = "**/*.gptool.js", specsPath = "**/*.gpspec.md" } =
        options || {}

    const gpspecFiles = await host.findFiles(specsPath)
    const gptoolFiles = await host.findFiles(toolsPath)
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
    spec: string,
    options: { out: string; retry: string; retryDelay: string; json: boolean }
) {
    const out = options.out
    const retry = parseInt(options.retry) || 3
    const retryDelay = parseInt(options.retryDelay) || 5000

    if (!spec) {
        const specContent = await getStdin()
        spec = "stdin.gpspec.md"
        host.setVirtualFile(spec, specContent)
    } else if (!/\.gpspec\.md$/i.test(spec)) {
        const fn = basename(spec)
        spec = spec + ".gpspec.md"
        host.setVirtualFile(
            spec,
            `# Specification

-   [${fn}](./${fn})
`
        )
    }

    const prj = await buildProject()
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
    const res = await backOff(
        async () =>
            await runTemplate(gptool, fragment, {
                infoCb: (progress) => {},
            }),
        {
            numOfAttempts: retry,
            startingDelay: retryDelay,
            maxDelay: 180000,
            retry: (e, attempt) => {
                if (isRequestError(e, 429)) {
                    console.error(
                        `rate limited, retry #${attempt} in ${retryDelay}s...`
                    )
                    return true
                }
                return false
            },
        }
    )

    if (out) {
        const jsonf = /\.json$/i.test(out) ? out : out + ".json"
        const outputf = jsonf.replace(/\.json$/i, ".output.md")
        const tracef = jsonf.replace(/\.json$/i, ".trace.md")
        console.log(`writing ${jsonf}, ${outputf} and ${tracef}`)
        await writeJSON(jsonf, res)
        if (res.text) await writeText(outputf, res.text)
        if (res.trace) await writeText(tracef, res.trace)
    } else {
        if (options.json) console.log(JSON.stringify(res, null, 2))
        else console.log(res.text)
    }
}

async function listTools() {
    const prj = await buildProject()
    prj.templates.forEach((t) =>
        console.log(`${t.id}: ${t.title} (${t.filename || "builtin"})`)
    )
}

async function listSpecs() {
    const prj = await buildProject()
    prj.rootFiles.forEach((f) => console.log(f.filename))
}

async function main() {
    NodeHost.install()
    program
        .name("gptools")
        .description("CLI for GPTools")
        .showHelpAfterError(true)
    program
        .command("run", { isDefault: true })
        .description("Runs a GPTools against a GPSpec")
        .arguments("<tool> [spec]")
        .option("-o, --out <string>", "output file")
        .option("-r, --retry <number>", "number of retries", "3")
        .option("-j, --json", "emit full JSON response to output")
        .option(
            "-rd, --retry-delay <number>",
            "minimum delay between retries",
            "5000"
        )
        .action(run)

    const keys = program.command("keys")
    keys.command("list", { isDefault: true })
        .description("List all available keys")
        .action(async () => {
            const key = await host.getSecretToken()
            console.log(
                key
                    ? `${key.isOpenAI ? "OpenAI" : key.isTGI ? "TGI" : key.url}`
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

    const tools = program.command("tools")
    tools
        .command("list", { isDefault: true })
        .description("List all available tools")
        .action(listTools)

    const specs = program.command("specs")
    specs
        .command("list", { isDefault: true })
        .description("List all available specs")
        .action(listSpecs)

    program.parse()
}

main()
