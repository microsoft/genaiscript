import { parseLLMDiffs } from "coarch-core"
import { NodeHost } from "./hostimpl"
import { program } from "commander"

async function run(
    str: string,
    options: {
        tool: string
        spec: string
    }
) {
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

    program.parse()
}

main()
