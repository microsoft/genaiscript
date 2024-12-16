/**
 * CLI entry point for the GenAIScript tool, providing various commands and options
 * for interacting with scripts, parsing files, testing, and managing cache.
 */

import { NodeHost } from "./nodehost" // Handles node environment setup
import { Option, program } from "commander" // Command-line argument parsing library
import { error, isQuiet, setConsoleColors, setQuiet } from "./log" // Logging utilities
import { startServer } from "./server" // Function to start server
import { NODE_MIN_VERSION, PROMPTFOO_VERSION } from "./version" // Version constants
import { runScriptWithExitCode } from "./run" // Execute scripts with exit code
import { retrievalFuzz, retrievalSearch } from "./retrieval" // Retrieval functions
import { helpAll } from "./help" // Display help for all commands
import {
    jsonl2json,
    parseAnyToJSON,
    parseDOCX,
    parseFence,
    parseHTMLToText,
    parseJinja2,
    parsePDF,
    parseTokens,
    prompty2genaiscript,
} from "./parse" // Parsing functions
import { compileScript, createScript, fixScripts, listScripts } from "./scripts" // Script utilities
import { codeQuery } from "./codequery" // Code parsing and query execution
import { envInfo, modelInfo, systemInfo } from "./info" // Information utilities
import { scriptTestList, scriptTestsView, scriptsTest } from "./test" // Test functions
import { cacheClear } from "./cache" // Cache management
import "node:console" // Importing console for side effects
import {
    UNHANDLED_ERROR_CODE,
    RUNTIME_ERROR_CODE,
    TOOL_ID,
    TOOL_NAME,
    SERVER_PORT,
    OPENAI_MAX_RETRY_DELAY,
    OPENAI_RETRY_DEFAULT_DEFAULT,
    OPENAI_MAX_RETRY_COUNT,
    GENAI_MD_EXT,
} from "../../core/src/constants" // Core constants
import {
    errorMessage,
    isRequestError,
    RequestError,
    serializeError,
} from "../../core/src/error" // Error handling utilities
import { CORE_VERSION, GITHUB_REPO } from "../../core/src/version" // Core version and repository info
import { logVerbose } from "../../core/src/util" // Utility logging
import { semverSatisfies } from "../../core/src/semver" // Semantic version checking
import { convertFiles } from "./convert"

/**
 * Main function to initialize and run the CLI.
 */
export async function cli() {
    let nodeHost: NodeHost // Variable to hold NodeHost instance

    // Handle uncaught exceptions globally
    process.on("uncaughtException", (err) => {
        const se = serializeError(err) // Serialize the error object
        error(errorMessage(se)) // Log the error message
        if (!isQuiet && se?.stack && nodeHost) logVerbose(se?.stack) // Log stack trace if not in quiet mode
        if (isRequestError(err)) {
            const exitCode = (err as RequestError).status // Use the error status as exit code
            process.exit(exitCode) // Exit with the error status code
        } else process.exit(UNHANDLED_ERROR_CODE) // Exit with a generic error code
    })

    // Verify Node.js version compatibility
    if (!semverSatisfies(process.version, NODE_MIN_VERSION)) {
        console.error(
            `node.js runtime incompatible, expected ${NODE_MIN_VERSION} got ${process.version}`
        )
        process.exit(RUNTIME_ERROR_CODE) // Exit with runtime error code if version is incompatible
    }

    program.hook("preAction", async (cmd) => {
        nodeHost = await NodeHost.install(cmd.opts().env) // Install NodeHost with environment options
    })

    // Configure CLI program options and commands
    program
        .name(TOOL_ID)
        .version(CORE_VERSION)
        .description(`CLI for ${TOOL_NAME} ${GITHUB_REPO}`)
        .showHelpAfterError(true)
        .option("--env <path>", "path to .env file, default is './.env'")
        .option("--no-colors", "disable color output")
        .option("-q, --quiet", "disable verbose output")

    // Set options for color and verbosity
    program.on("option:no-colors", () => setConsoleColors(false))
    program.on("option:quiet", () => setQuiet(true))

    // Define 'run' command for executing scripts
    program
        .command("run")
        .description("Runs a GenAIScript against files.")
        .arguments("<script> [files...]")
        .option("-m, --model <string>", "'large' model alias (default)")
        .option("-sm, --small-model <string>", "'small' alias model")
        .option("-vm, --vision-model <string>", "'vision' alias model")
        .option("-ma, --model-alias <nameid...>", "model alias as name=modelid")
        .option("-lp, --logprobs", "enable reporting token probabilities")
        .option(
            "-tlp, --top-logprobs <number>",
            "number of top logprobs (1 to 5)"
        )
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option(
            "-egi, --exclude-git-ignore",
            "exclude files that are ignored through the .gitignore file in the workspace root"
        )
        .option(
            "-ft, --fallback-tools",
            "Enable prompt-based tools instead of builtin LLM tool calling builtin tool calls"
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
        .option("-pr, --pull-request <number>", "pull request identifier")
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
        .option(`-fe, --fail-on-errors`, `fails on detected annotation error`)
        .option(
            "-r, --retry <number>",
            "number of retries",
            String(OPENAI_MAX_RETRY_COUNT)
        )
        .option(
            "-rd, --retry-delay <number>",
            "minimum delay between retries",
            String(OPENAI_RETRY_DEFAULT_DEFAULT)
        )
        .option(
            "-md, --max-delay <number>",
            "maximum delay between retries",
            String(OPENAI_MAX_RETRY_DELAY)
        )
        .option("-l, --label <string>", "label for the run")
        .option("-t, --temperature <number>", "temperature for the run")
        .option("-tp, --top-p <number>", "top-p for the run")
        .option(
            "-mt, --max-tokens <number>",
            "maximum completion tokens for the run"
        )
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
        .option("-c, --cache", "enable LLM result cache")
        .option("-cn, --cache-name <name>", "custom cache file name")
        .option("-cs, --csv-separator <string>", "csv separator", "\t")
        .addOption(
            new Option("-ff, --fence-format <string>", "fence format").choices([
                "xml",
                "markdown",
                "none",
            ])
        )
        .option("-ae, --apply-edits", "apply file edits")
        .option(
            "--vars <namevalue...>",
            "variables, as name=value, stored in env.vars. Use environment variables GENAISCRIPT_VAR_name=value to pass variable through the environment"
        )
        .option(
            "-rr, --run-retry <number>",
            "number of retries for the entire run"
        )
        .action(runScriptWithExitCode) // Action to execute the script with exit code

    // Define 'test' command group for running tests
    const test = program.command("test")

    test.command("run", { isDefault: true })
        .description("Runs the tests for scripts")
        .argument(
            "[script...]",
            "Script ids. If not provided, all scripts are tested"
        )
        .option("-m, --model <string>", "model for the run")
        .option("-sm, --small-model <string>", "small model for the run")
        .option("-vm, --vision-model <string>", "'vision' alias model")
        .option(
            "--models <models...>",
            "models to test where mode is the key value pair list of m (model), s (small model), t (temperature), p (top-p)"
        )
        .option("-o, --out <folder>", "output folder")
        .option("-rmo, --remove-out", "remove output folder if it exists")
        .option("--cli <string>", "override path to the cli")
        .option("-td, --test-delay <string>", "delay between tests in seconds")
        .option("--cache", "enable LLM result cache")
        .option("-v, --verbose", "verbose output")
        .option(
            "-pv, --promptfoo-version [version]",
            `promptfoo version, default is ${PROMPTFOO_VERSION}`
        )
        .option("-os, --out-summary <file>", "append output summary in file")
        .option(
            "-g, --groups <groups...>",
            "groups to include or exclude. Use :! prefix to exclude"
        )
        .action(scriptsTest) // Action to run the tests

    // List available tests
    test.command("list")
        .description("List available tests in workspace")
        .action(scriptTestList) // Action to list the tests
        .option(
            "-g, --groups <groups...>",
            "groups to include or exclude. Use :! prefix to exclude"
        )

    // Launch test viewer
    test.command("view")
        .description("Launch test viewer")
        .action(scriptTestsView) // Action to view the tests

    program
        .command("convert")
        .description(
            "Converts file through a GenAIScript. Each file is processed separately through the GenAIScript and the LLM output is saved to a <filename>.genai.md (or custom suffix)."
        )
        .arguments("<script> [files...]")
        .option(
            "-s, --suffix <string>",
            "suffix for output files",
            GENAI_MD_EXT
        )
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option(
            "-egi, --exclude-git-ignore",
            "exclude files that are ignored through the .gitignore file in the workspace root"
        )
        .option("-m, --model <string>", "'large' model alias (default)")
        .option("-sm, --small-model <string>", "'small' alias model")
        .option("-vm, --vision-model <string>", "'vision' alias model")
        .option("-ma, --model-alias <nameid...>", "model alias as name=modelid")
        .option(
            "-ft, --fallback-tools",
            "Enable prompt-based tools instead of builtin LLM tool calling builtin tool calls"
        )
        .option(
            "-o, --out <string>",
            "output folder. Extra markdown fields for output and trace will also be generated"
        )
        .option(
            "--vars <namevalue...>",
            "variables, as name=value, stored in env.vars. Use environment variables GENAISCRIPT_VAR_name=value to pass variable through the environment"
        )
        .option("-c, --cache", "enable LLM result cache")
        .option("-cn, --cache-name <name>", "custom cache file name")
        .action(convertFiles)

    // Define 'scripts' command group for script management tasks
    const scripts = program
        .command("scripts")
        .alias("script")
        .description("Utility tasks for scripts")
    scripts
        .command("list", { isDefault: true })
        .description("List all available scripts in workspace")
        .option(
            "-g, --groups <groups...>",
            "groups to include or exclude. Use :! prefix to exclude"
        )
        .action(listScripts) // Action to list scripts
    scripts
        .command("create")
        .description("Create a new script")
        .argument("<name>", "Name of the script")
        .action(createScript) // Action to create a script
    scripts
        .command("fix")
        .description("fix all definition files")
        .action(fixScripts) // Action to fix scripts
    scripts
        .command("compile")
        .description("Compile all scripts in workspace")
        .argument("[folders...]", "Pattern to match files")
        .action(compileScript) // Action to compile scripts
    scripts
        .command("model")
        .description("List model connection information for scripts")
        .argument("[script]", "Script id or file")
        .option("-t, --token", "show token")
        .action(modelInfo) // Action to show model information

    // Define 'cache' command for cache management
    const cache = program.command("cache").description("Cache management")
    cache
        .command("clear")
        .description("Clear cache")
        .argument("[name]", "Name of the cache, tests")
        .action(cacheClear) // Action to clear cache

    // Define 'retrieval' command group for RAG support
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
        .action(retrievalSearch) // Action to perform vector search
    retrieval
        .command("fuzz")
        .description("Search using string distance")
        .arguments("<query> [files...]")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .option("-tk, --top-k <number>", "maximum number of results")
        .action(retrievalFuzz) // Action to perform fuzzy search

    // Define 'serve' command to start a local server
    program
        .command("serve")
        .description("Start a GenAIScript local server")
        .option(
            "-p, --port <number>",
            `Specify the port number, default: ${SERVER_PORT}`
        )
        .option("-k, --api-key <string>", "API key to authenticate requests")
        .action(startServer) // Action to start the server

    // Define 'parse' command group for parsing tasks
    const parser = program
        .command("parse")
        .alias("parsers")
        .description("Parse various outputs")
    const parserData = parser
        .command("data <file>")
        .description(
            "Convert CSV, YAML, TOML, INI, XLSX, XML, MD/X frontmatter or JSON data files into various formats"
        )
        .action(parseAnyToJSON)
    parserData.addOption(
        new Option("-f, --format <string>", "output format").choices([
            "json",
            "json5",
            "yaml",
            "ini",
            "csv",
            "md",
        ])
    )
    parser
        .command("fence <language> <file>")
        .description("Extracts a code fenced regions of the given type")
        .action(parseFence) // Action to parse fenced code regions
    parser
        .command("pdf <file>")
        .description("Parse a PDF into text and images")
        .option("-i, --images", "extract images")
        .option("-o, --out <string>", "output folder")
        .action(parsePDF) // Action to parse PDF files
    parser
        .command("docx <file>")
        .description("Parse a DOCX into texts")
        .action(parseDOCX) // Action to parse DOCX files
    parser
        .command("html-to-text <file>")
        .description("Parse an HTML file into text")
        .action(parseHTMLToText) // Action to parse HTML files
    parser
        .command("code")
        .description("Parse code using tree sitter and executes a query")
        .arguments("<file> [query]")
        .action(codeQuery) // Action to parse and query code files
    parser
        .command("tokens")
        .description("Count tokens in a set of files")
        .arguments("<files...>")
        .option("-ef, --excluded-files <string...>", "excluded files")
        .action(parseTokens) // Action to count tokens in files
    parser
        .command("jsonl2json", "Converts JSONL files to a JSON file")
        .argument("<file...>", "input JSONL files")
        .action(jsonl2json) // Action to convert JSONL to JSON
    parser
        .command("prompty")
        .description("Converts .prompty files to genaiscript")
        .argument("<file...>", "input JSONL files")
        .option("-o, --out <string>", "output folder")
        .action(prompty2genaiscript) // Action to convert prompty files
    parser
        .command("jinja2")
        .description("Renders Jinj2 or prompty template")
        .argument("<file>", "input Jinja2 or prompty template file")
        .option(
            "--vars <namevalue...>",
            "variables, as name=value passed to the template"
        )
        .action(parseJinja2)

    // Define 'info' command group for utility information tasks
    const info = program.command("info").description("Utility tasks")
    info.command("help")
        .description("Show help for all commands")
        .action(helpAll) // Action to show help for commands
    info.command("system")
        .description("Show system information")
        .action(systemInfo) // Action to show system information
    info.command("env")
        .description("Show .env information")
        .arguments("[provider]")
        .option("-t, --token", "show token")
        .option("-e, --error", "show errors")
        .option("-m, --models", "show models if possible")
        .action(envInfo) // Action to show environment information
    program.parse() // Parse command-line arguments
}
