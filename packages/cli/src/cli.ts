import {
    RequestError,
    CORE_VERSION,
    isRequestError,
    TOOL_ID,
    TOOL_NAME,
    GITHUB_REPO,
    SERVER_PORT,
    RUNTIME_ERROR_CODE,
    UNHANDLED_ERROR_CODE,
    errorMessage,
    dotGenaiscriptPath,
} from "genaiscript-core"
import { NodeHost } from "./nodehost"
import { program } from "commander"
import { error, isQuiet, setConsoleColors, setQuiet } from "./log"
import { startServer } from "./server"
import { satisfies as semverSatisfies } from "semver"
import { NODE_MIN_VERSION, PROMPTFOO_VERSION } from "./version"
import { runScript } from "./run"
import { batchScript } from "./batch"
import {
    retrievalClear,
    retrievalFuzz,
    retrievalIndex,
    retrievalSearch,
} from "./retrieval"
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
import { modelInfo, systemInfo } from "./info"
import { scriptTestsView, scriptsTest } from "./test"
import { emptyDir } from "fs-extra"
import { join } from "path"

async function cacheClear(name: string) {
    let dir = dotGenaiscriptPath("cache")
    if (["tests"].includes(name)) dir = join(dir, name)
    console.log(`removing ${dir}`)
    await emptyDir(dir)
}

export async function cli() {
    process.on("uncaughtException", (err) => {
        error(isQuiet ? err : errorMessage(err))
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
        .description("Runs a GenAIScript against files.")
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
        .option(
            "-mtc, --max-tool-calls <number>",
            "maximum tool calls for the run"
        )
        .option("-se, --seed <number>", "seed for the run")
        .option("--no-cache", "disable LLM result cache")
        .option("-cn, --cache-name <name>", "custom cache file name")
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
        .option("-cn, --cache-name <name>", "custom cache file name")
        .option("-ae, --apply-edits", "apply file edits")
        .option(
            "--vars <string...>",
            "variables, as name=value, stored in env.vars"
        )
        .action(batchScript)

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
            `propmtfoo version, default is ${PROMPTFOO_VERSION}`
        )
        .option("-os, --out-summary <file>", "append output summary in file")
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
        .command("index")
        .description("Index a set of documents")
        .argument("<file...>", "Files to index")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option("-n, --name <string>", "index name")
        .option("-cs, --chunk-size <number>", "chunk size")
        .option("-co, --chunk-overlap <number>", "chunk overlap")
        .option("-m, --model <string>", "model for embeddings")
        .option("-t, --temperature <number>", "LLM temperature")
        .action(retrievalIndex)
    retrieval
        .command("search")
        .description("Search using vector embeddings similarity")
        .arguments("<query> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option("-tk, --top-k <number>", "maximum number of results")
        .option("-n, --name <string>", "index name")
        .action(retrievalSearch)
    retrieval
        .command("clear")
        .description("Clear index to force re-indexing")
        .option("-n, --name <string>", "index name")
        .action(retrievalClear)
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
        .command("html-to-text [file]")
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

    const info = program.command("info").description("Utility tasks")
    info.command("help")
        .description("Show help for all commands")
        .action(helpAll)
    info.command("system")
        .description("Show system information")
        .action(systemInfo)

    program.parse()
}
