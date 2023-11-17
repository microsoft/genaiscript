import { host, parseLLMDiffs, parseProject } from "coarch-core"
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

async function run(
    str: string,
    options: {
        tool: string
        spec: string
    }
) {}

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
    program.name("gptools").description("CLI for GPTools")
    program
        .command("run", { isDefault: true })
        .description("Runs a GPTools against a GPSpec")
        .requiredOption("-t, --tool <string>", "tool to execute")
        .requiredOption("-s, --spec", "gpspec file to start from")
        .action(run)

    program
        .command("tools")
        .description("List all available tools")
        .action(listTools)

    program
        .command("specs")
        .description("List all available specs")
        .action(listSpecs)

    program.parse()
}

main()
