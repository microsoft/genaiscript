import {
    clearToken,
    host,
    parseProject,
    runTemplate,
    setToken,
} from "coarch-core"
import { NodeHost } from "./hostimpl"
import { program } from "commander"

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

async function run(options: { tool: string; spec: string }) {
    const prj = await buildProject()
    const gptool = prj.templates.find((t) => t.id === options.tool)
    if (!gptool) throw new Error("Tool not found")
    const gpspec = prj.rootFiles.find((f) => f.filename.endsWith(options.spec))
    if (!gpspec) throw new Error("Spec not found")

    const res = await runTemplate(gptool, [], gpspec.roots[0], {
        infoCb: (progress) => {
            console.log(progress?.text)
        },
    })
    console.log(JSON.stringify(res, null, 2))
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
        .requiredOption("-t, --tool <string>", "tool to execute")
        .requiredOption("-s, --spec <string>", "gpspec file to start from")
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
