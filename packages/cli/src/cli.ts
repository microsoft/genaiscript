import { NodeHost } from "./nodehost"
import { program } from "commander"
import { error, isQuiet, setConsoleColors, setQuiet } from "./log"
import { startServer } from "./server"
import { NODE_MIN_VERSION, PROMPTFOO_VERSION } from "./version"
import { runScriptWithExitCode } from "./run"
import { retrievalFuzz, retrievalSearch } from "./retrieval"
import { helpAll } from "./help"
import {
    jsonl2json,
    parseDOCX,
    parseFence,
    parseHTMLToText,
    parsePDF,
    parseTokens,
} from "./parse"
import { compileScript, createScript, fixScripts, listScripts } from "./scripts"
import { codeQuery } from "./codequery"
import { envInfo, modelInfo, systemInfo } from "./info"
import { scriptTestsView, scriptsTest } from "./test"
import { cacheClear } from "./cache"
import "node:console"
import {
    UNHANDLED_ERROR_CODE,
    RUNTIME_ERROR_CODE,
    TOOL_ID,
    TOOL_NAME,
    SERVER_PORT,
} from "../../core/src/constants"
import {
    errorMessage,
    isRequestError,
    RequestError,
    serializeError,
} from "../../core/src/error"
import { CORE_VERSION, GITHUB_REPO } from "../../core/src/version"
import { grep } from "./grep"
import { logVerbose } from "../../core/src/util"
import { semverSatisfies } from "../../core/src/semver"

export async function cli() {
    process.on("uncaughtException", (err) => {
        const se = serializeError(err)
        error(errorMessage(se))
        if (!isQuiet && se?.stack) logVerbose(se?.stack)
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

    let nodeHost: NodeHost
    program.hook("preAction", async (cmd) => {
        nodeHost = await NodeHost.install(cmd.opts().env)
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
        .command("run", { isDefault: true })
        .description("Runs a GenAIScript against files.")
        .arguments("<script> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option(
            "-egi, --exclude-git-ignore",
            "exclude files that are ignore through the .gitignore file in the workspace root"
        )
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
        .option(
            "-prc, --pull-request-comment [string]",
            "create comment on a pull request with a unique id (defaults to script id)"
        )
        .option(
            "-prd, --pull-request-description [string]",
            "create comment on a pull request description with a unique id (defaults to script id)"
        )
        .option(
            "-prr, --pull-request-reviews",
            "create pull request reviews from annotations"
        )
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
        .option("-mdr, --max-data-repairs <number>", "maximum data repairs")
        .option(
            "-mtc, --max-tool-calls <number>",
            "maximum tool calls for the run"
        )
        .option("-se, --seed <number>", "seed for the run")
        .option(
            "-em, --embeddings-model <string>",
            "embeddings model for the run"
        )
        .option("--no-cache", "disable LLM result cache")
        .option("-cn, --cache-name <name>", "custom cache file name")
        .option("-cs, --csv-separator <string>", "csv separator", "\t")
        .option("-ae, --apply-edits", "apply file edits")
        .option(
            "--vars <namevalue...>",
            "variables, as name=value, stored in env.vars"
        )
        .option(
            "-rr, --run-retry <number>",
            "number of retries for the entire run"
        )
        .action(runScriptWithExitCode)

    const test = program.command("test")

    test.command("run", { isDefault: true })
        .description("Runs the tests for scripts")
        .argument(
            "[script...]",
            "Script ids. If not provided, all scripts are tested"
        )
        .option(
            "--models <models...>",
            "models to test where mode is the key value pair list of m (model), t (temperature), p (top-p)"
        )
        .option("-o, --out <folder>", "output folder")
        .option("-rmo, --remove-out", "remove output folder if it exists")
        .option("--cli <string>", "override path to the cli")
        .option("-tp, --test-provider <string>", "test provider")
        .option("-td, --test-delay <string>", "delay between tests in seconds")
        .option("--no-cache", "disable LLM result cache")
        .option("-v, --verbose", "verbose output")
        .option(
            "-pv, --promptfoo-version [version]",
            `promptfoo version, default is ${PROMPTFOO_VERSION}`
        )
        .option("-os, --out-summary <file>", "append output summary in file")
        .option(
            "--groups <groups...>",
            "groups to include or exclude. Use :! prefix to exclude"
        )
        .action(scriptsTest)

    test.command("view")
        .description("Launch test viewer")
        .action(scriptTestsView)

    const scripts = program
        .command("scripts")
        .alias("script")
        .description("Utility tasks for scripts")
    scripts
        .command("list", { isDefault: true })
        .description("List all available scripts in workspace")
        .action(listScripts)
    scripts
        .command("create")
        .description("Create a new script")
        .argument("<name>", "Name of the script")
        .action(createScript)
    scripts
        .command("fix")
        .description("fix all definition files")
        .action(fixScripts)
    scripts
        .command("compile")
        .description("Compile all script in workspace")
        .argument("[folders...]", "Pattern to match files")
        .action(compileScript)
    scripts
        .command("model")
        .description("List model connection information for scripts")
        .argument("[script]", "Script id or file")
        .option("-t, --token", "show token")
        .action(modelInfo)

    const cache = program.command("cache").description("Cache management")
    const clear = cache
        .command("clear")
        .description("Clear cache")
        .argument("[name]", "Name of the cache, tests")
        .action(cacheClear)

    const retrieval = program
        .command("retrieval")
        .alias("retreival")
        .description("RAG support")
    retrieval
        .command("search")
        .description("Search using vector embeddings similarity")
        .arguments("<query> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option("-tk, --top-k <number>", "maximum number of results")
        .action(retrievalSearch)
    retrieval
        .command("fuzz")
        .description("Search using string distance")
        .arguments("<query> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option("-tk, --top-k <number>", "maximum number of results")
        .action(retrievalFuzz)
    retrieval.command("code")

    program
        .command("serve")
        .description("Start a GenAIScript local server")
        .option(
            "-p, --port <number>",
            `Specify the port number, default: ${SERVER_PORT}`
        )
        .action(startServer)

    const parser = program
        .command("parse")
        .alias("parsers")
        .description("Parse various outputs")
    parser
        .command("fence <language> <file>")
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
        .command("html-to-text <file>")
        .description("Parse an HTML file into text")
        .action(parseHTMLToText)

    parser
        .command("code")
        .description("Parse code using tree sitter and executes a query")
        .arguments("<file> [query]")
        .action(codeQuery)
    parser
        .command("tokens")
        .description("Count tokens in a set of files")
        .arguments("<files...>")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .action(parseTokens)
    parser
        .command("jsonl2json", "Converts JSONL files to a JSON file")
        .argument("<file...>", "input JSONL files")
        .action(jsonl2json)

    const workspace = program
        .command("workspace")
        .description("Workspace tasks")
    workspace.command("grep").arguments("<pattern> [files...]").action(grep)

    const info = program.command("info").description("Utility tasks")
    info.command("help")
        .description("Show help for all commands")
        .action(helpAll)
    info.command("system")
        .description("Show system information")
        .action(systemInfo)
    info.command("env")
        .description("Show .env information")
        .arguments("[provider]")
        .option("-t, --token", "show token")
        .action(envInfo)

    program.parse()
}
