// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * CLI entry point for the GenAIScript tool, providing various commands and options
 * for interacting with scripts, parsing files, testing, and managing cache.
 */
import { NODE_MIN_VERSION, PROMPTFOO_VERSION, NodeHost } from "@genaiscript/runtime";
import { Command, Option, program } from "commander";
import {
  CORE_VERSION,
  DEBUG_SCRIPT_CATEGORY,
  GITHUB_REPO,
  MODEL_PROVIDERS,
  OPENAI_MAX_RETRY_COUNT,
  OPENAI_MAX_RETRY_DELAY,
  OPENAI_RETRY_DEFAULT_DEFAULT,
  RUNTIME_ERROR_CODE,
  SERVER_PORT,
  TOOL_ID,
  TOOL_NAME,
  UNHANDLED_ERROR_CODE,
  GitClient,
  errorMessage,
  genaiscriptDebug,
  isQuiet,
  isRequestError,
  logPerformance,
  logVerbose,
  semverSatisfies,
  serializeError,
  setConsoleColors,
  setQuiet,
} from "@genaiscript/core";
import type { RequestError } from "@genaiscript/core";
import { startServer } from "./server.js";
import { runScriptWithExitCode } from "./run.js";
import { retrievalFuzz, retrievalIndex, retrievalSearch } from "./retrieval.js";
import { helpAll } from "./help.js";
import {
  jsonl2json,
  parseAnyToJSON,
  parseDOCX,
  parseFence,
  parseHTMLToText,
  parseJinja2,
  parseMarkdown,
  parsePDF,
  parseSecrets,
  parseTokenize,
  parseTokens,
  prompty2genaiscript,
} from "./parse.js";
import { createScript, fixScripts, listScripts, scriptInfo } from "./scripts.js";
import { envInfo, modelAliasesInfo, modelList, scriptModelInfo, systemInfo } from "./info.js";
import { scriptTestList, scriptTestsView, scriptsTest } from "./test.js";
import { cacheClear } from "./cache.js";
import "node:console";
import { convertFiles } from "./convert.js";
import { extractAudio, extractVideoFrames, probeVideo } from "./video.js";
import { configure } from "./configure.js";
import { listRuns } from "./runs.js";
import { startMcpServer } from "./mcpserver.js";
import { error } from "./log.js";
import { startOpenAPIServer } from "./openapi.js";
import { actionConfigure } from "./action.js";
import { resolve } from "node:path";
import debug from "debug";
import { githubActionConfigure } from "./githubaction.js";
import { uniq } from "es-toolkit";
import { compileScript } from "./typescript.js";
const dbg = genaiscriptDebug("cli");

/**
 * /NOП/
 */
export async function cli() {
  let nodeHost: NodeHost; // Variable to hold NodeHost instance

  // Handle uncaught exceptions globally
  process.on("uncaughtException", (err) => {
    const se = serializeError(err); // Serialize the error object
    error(errorMessage(se)); // Log the error message
    if (!isQuiet && se?.stack && nodeHost) logVerbose(se?.stack); // Log stack trace if not in quiet mode
    if (isRequestError(err)) {
      const exitCode = (err as RequestError).status; // Use the error status as exit code
      process.exit(exitCode); // Exit with the error status code
    } else process.exit(UNHANDLED_ERROR_CODE); // Exit with a generic error code
  });

  // Verify Node.js version compatibility
  if (!semverSatisfies(process.version, NODE_MIN_VERSION)) {
    console.error(
      `node.js runtime incompatible, expected ${NODE_MIN_VERSION} got ${process.version}`,
    );
    process.exit(RUNTIME_ERROR_CODE); // Exit with runtime error code if version is incompatible
  }

  program.hook("preAction", async (cmd) => {
    let { cwd }: { cwd: string } = cmd.opts();
    const {
      env,
      include,
      githubWorkspace,
    }: {
      env: string[];
      include: string;
      githubWorkspace: boolean;
    } = cmd.opts(); // Get environment options from command
    const includes: string[] = []; // Array to hold include paths
    let ignoreCurrentWorkspace = false;
    if (include) includes.push(resolve(include));
    if (githubWorkspace) {
      const { workspaceDir } = githubActionConfigure();
      if (workspaceDir && resolve(workspaceDir) !== resolve(process.cwd())) {
        includes.push(resolve(process.cwd(), "genaisrc", "*.genai.mts"));
        ignoreCurrentWorkspace = true;
        cwd = resolve(workspaceDir);
        dbg(`github action workspace: %s`, cwd);
        GitClient.default().setGitHubWorkspace(cwd);
      }
    }
    if (cwd) {
      dbg(`chdir %s`, cwd);
      process.chdir(cwd);
    }
    nodeHost = await NodeHost.install(env?.length ? env : undefined, {
      include: includes.length
        ? uniq(includes).map((pattern) => ({
            pattern,
            ignoreGitIgnore: true,
          }))
        : undefined,
      ignoreCurrentWorkspace,
    }); // Install NodeHost with environment options
    dbg(`cwd: %s`, process.cwd());
    dbg(`config: %O`, nodeHost.config);
  });

  // Configure CLI program options and commands
  program
    .name(TOOL_ID)
    .version(CORE_VERSION)
    .description(`CLI for ${TOOL_NAME} ${GITHUB_REPO}`)
    .showHelpAfterError(true)
    .option("--cwd <string>", "Working directory")
    .option("--include <string>", "Add 'include' directory to lookup scripts")
    .option("--env <paths...>", "paths to .env files, defaults to './.env' if not specified")
    .option("--no-colors", "disable color output")
    .option("-q, --quiet", "disable verbose output")
    .option("--perf", "enable performance logging")
    .option("--github-workspace", "Use GitHub Actions workspace directory as cwd");

  program.on("option:no-colors", () => setConsoleColors(false));
  program.on("option:quiet", () => setQuiet(true));
  program.on("option:perf", () => logPerformance());
  program.on("option:debug", (c: string) =>
    debug.enable(c === DEBUG_SCRIPT_CATEGORY ? c : `genaiscript:${c}`),
  );

  const configureCmd = program.command("configure").description("Configure LLMs or GitHub Actions");
  configureCmd.command("llm", { isDefault: true }).description("Configure LLM providers");
  addProviderOptions(configureCmd).action(configure);

  // Define 'run' command for executing scripts
  const run = program
    .command("run")
    .description("Runs a GenAIScript against files.")
    .arguments("<script> [files...]")
    .option("--accept <string>", "comma separated list of accepted file extensions");
  addModelOptions(run); // Add model options to the command
  addLogProbsOptions(run)
    .option("-e, --excluded-files <string...>", "excluded files")
    .option(
      "--ignore-git-ignore",
      "by default, files ignored by .gitignore are excluded. disables this mode",
    )
    .option(
      "--fallback-tools",
      "Enable prompt-based tools instead of builtin LLM tool calling builtin tool calls",
    )
    .option(
      "-o, --out <string>",
      "output folder. Extra markdown fields for output and trace will also be generated",
    )
    .option("--remove-out", "remove output folder if it exists")
    .option("--out-trace <string>", "output file for trace")
    .option("--out-output <string>", "output file for output")
    .option(
      "--out-data <string>",
      "output file for data (.jsonl/ndjson will be aggregated). JSON schema information and validation will be included if available.",
    )
    .option(
      "--out-annotations <string>",
      "output file for annotations (.csv will be rendered as csv, .jsonl/ndjson will be aggregated)",
    )
    .option("--out-changelog <string>", "output file for changelogs")
  addPullRequestOptions(run)
    .option("--teams-message", "Posts a message to the teams channel")
    .option("-j, --json", "emit full JSON response to output")
    .option(`--fail-on-errors`, `fails on detected annotation error`)
    .option("--retry <number>", "number of retries", String(OPENAI_MAX_RETRY_COUNT))
    .option(
      "--retry-delay <number>",
      "minimum delay between retries",
      String(OPENAI_RETRY_DEFAULT_DEFAULT),
    )
    .option("--max-delay <number>", "maximum delay between retries", String(OPENAI_MAX_RETRY_DELAY))
    .option("-l, --label <string>", "label for the run")
    .option("-t, --temperature <number>", "temperature for the run")
    .option("--top-p <number>", "top-p for the run")
    .option("--max-tokens <number>", "maximum completion tokens for the run")
    .option("--max-data-repairs <number>", "maximum data repairs")
    .option("--max-tool-calls <number>", "maximum tool calls for the run")
    .option(
      "--tool-choice <string>",
      "tool choice for the run, 'none', 'auto', 'required', or a function name",
    )
    .option("--seed <number>", "seed for the run")
    .option("-c, --cache", "enable LLM result cache")
    .option("--cache-name <name>", "custom cache file name")
    .option("--csv-separator <string>", "csv separator", "\t")
    .addOption(
      new Option("--fence-format <string>", "fence format").choices(["xml", "markdown", "none"]),
    )
    .option("-y, --apply-edits", "apply file edits")
    .option(
      "-x, --vars <namevalue...>",
      "variables, as name=value, stored in env.vars. Use environment variables GENAISCRIPT_VAR_name=value to pass variable through the environment",
    )
    .option("--run-retry <number>", "number of retries for the entire run")
    .option("--no-run-trace", "disable automatic trace generation")
    .option("--no-output-trace", "disable automatic output generation")
    .action(runScriptWithExitCode); // Action to execute the script with exit code

  // runs commands
  const runs = program.command("runs").description("Commands to open previous runs");
  runs
    .command("list")
    .description("List all available run reports in workspace")
    .argument("[script]", "Script id")
    .action(listRuns);

  // Define 'test' command group for running tests
  const test = program.command("test").alias("eval");

  const testRun = test
    .command("run", { isDefault: true })
    .description("Runs the tests for scripts")
    .argument("[script...]", "Script ids. If not provided, all scripts are tested")
    .option("--redteam", "run red team tests");
  addModelOptions(testRun) // Add model options to the command
    .option(
      "--models <models...>",
      "models to test where mode is the key value pair list of m (model), s (small model), t (temperature), p (top-p)",
    )
    .option("--max-concurrency <number>", "maximum concurrency", "1")
    .option("-o, --out <folder>", "output folder")
    .option("--remove-out", "remove output folder if it exists")
    .option("--cli <string>", "override path to the cli")
    .option("--test-delay <string>", "delay between tests in seconds")
    .option("--cache", "enable LLM result cache")
    .option("-r, --random", "Randomize test order")
    .option("-v, --verbose", "verbose output")
    .option("--promptfoo-version [version]", `promptfoo version, default is ${PROMPTFOO_VERSION}`)
    .option("--out-summary <file>", "append output summary in file");
  addGroupsOptions(testRun)
    .option("--test-timeout <number>", "test timeout in seconds")
    .action(scriptsTest); // Action to run the tests

  // List available tests
  const testList = test
    .command("list")
    .description("List available tests in workspace")
    .option("--redteam", "list red team tests");
  addGroupsOptions(testList).action(scriptTestList); // Action to list the tests

  // Launch test viewer
  test.command("view").description("Launch test viewer").action(scriptTestsView); // Action to view the tests

  const convert = program
    .command("convert")
    .description(
      "Converts file through a GenAIScript. Each file is processed separately through the GenAIScript and the LLM output is saved to a <filename>.genai.md (or custom suffix).",
    )
    .arguments("<script> [files...]")
    .option("-u, --suffix <string>", "suffix for converted files")
    .option("-r, --rewrite", "rewrite input file with output (overrides suffix)")
    .option(
      "-w, --cancel-word <string>",
      "cancel word which allows the LLM to notify to ignore output",
    )
    .option("-e, --excluded-files <string...>", "excluded files")
    .option(
      "--ignore-git-ignore",
      "by default, files ignored by .gitignore are excluded. disables this mode",
    );
  addModelOptions(convert)
    .option(
      "--fallback-tools",
      "Enable prompt-based tools instead of builtin LLM tool calling builtin tool calls",
    )
    .option(
      "-o, --out <string>",
      "output folder. Extra markdown fields for output and trace will also be generated",
    )
    .option(
      "-x, --vars <namevalue...>",
      "variables, as name=value, stored in env.vars. Use environment variables GENAISCRIPT_VAR_name=value to pass variable through the environment",
    )
    .option("-c, --cache", "enable LLM result cache")
    .option("--cache-name <name>", "custom cache file name")
    .option("--concurrency <number>", "number of concurrent conversions")
    .option("--no-run-trace", "disable automatic trace generation")
    .option("--no-output-trace", "disable automatic output generation")
    .action(convertFiles);

  // Define 'scripts' command group for script management tasks
  const scripts = program
    .command("scripts")
    .alias("script")
    .description("Utility tasks for scripts");
  const scriptList = scripts
    .command("list", { isDefault: true })
    .description("List all available scripts in workspace")
    .argument("[script...]", "Script ids")
    .option("--unlisted", "show unlisted scripts")
    .option("--json", "output in JSON format");
  addGroupsOptions(scriptList).action(listScripts); // Action to list scripts
  scripts
    .command("create")
    .description("Create a new script")
    .argument("[name]", "Name of the script")
    .option("-t, --typescript", "Generate TypeScript file (.genai.mts)", true)
    .action(createScript); // Action to create a script
  scripts
    .command("fix")
    .description("Write TypeScript definition files in the script folder to enable type checking.")
    .option(
      "--github-copilot-instructions",
      "Write GitHub Copilot custom instructions for better GenAIScript code generation",
    )
    .option("--docs", "Download documentation")
    .option("--force", "Fix all folders, including built-in system scripts")
    .action(fixScripts); // Action to fix scripts
  scripts
    .command("compile")
    .description("Compile all scripts in workspace")
    .argument("[folders...]", "Pattern to match files")
    .action(compileScript); // Action to compile scripts
  scripts
    .command("model")
    .description("List model connection information for scripts")
    .argument("[script]", "Script id or file")
    .option("-t, --token", "show token")
    .action(scriptModelInfo); // Action to show model information
  scripts
    .command("help")
    .alias("info")
    .description("Show help information for a script")
    .argument("<script>", "Script id")
    .action(scriptInfo); // Action to show model information

  // Define 'cache' command for cache management
  const cache = program.command("cache").description("Cache management");
  cache
    .command("clear")
    .description("Clear cache")
    .argument("[name]", "Name of the cache, tests")
    .action(cacheClear); // Action to clear cache

  const video = program.command("video").description("Video tasks");
  video
    .command("probe")
    .description("Probes metadata from a video/audio file")
    .argument("<file>", "Audio or video file to inspect")
    .action(probeVideo);

  video
    .command("extract-audio")
    .description("Transcode video/audio file")
    .argument("<file>", "Audio or video file to transcode")
    .option("-t, --transcription", "Convert audio for speech-to-text")
    .action(extractAudio);
  video
    .command("extract-frames")
    .description("Extract video frames")
    .argument("<file>", "Audio or video file to transcode")
    .option("-k, --keyframes", "Extract only keyframes (intra frames)")
    .option("-t, --scene-threshold <number>", "Extract frames with a minimum threshold")
    .option("-c, --count <number>", "maximum number of frames to extract")
    .option("-s, --size <string>", "size of the output frames wxh")
    .option("-f, --format <string>", "Image file format")
    .action(extractVideoFrames);

  // Define 'retrieval' command group for RAG support
  const retrieval = program.command("retrieval").description("RAG support");
  retrieval
    .command("index")
    .arguments("<name> <files...>")
    .description("Index files for vector search")
    .option("-e, --excluded-files <string...>", "excluded files")
    .option(
      "--ignore-git-ignore",
      "by default, files ignored by .gitignore are excluded. disables this mode",
    )
    .option("-g, --embeddings-model <string>", "'embeddings' alias model")
    .addOption(
      new Option("--database <string>", "Type of database to use for indexing").choices([
        "local",
        "azure_ai_search",
      ]),
    )
    .action(retrievalIndex); // Action to index files for vector search

  retrieval
    .command("vector")
    .alias("search")
    .description("Search using vector embeddings similarity")
    .arguments("<query> [files...]")
    .option("-e, --excluded-files <string...>", "excluded files")
    .option("-k, --top-k <number>", "maximum number of results")
    .option("-s, --min-score <number>", "minimum score")
    .action(retrievalSearch); // Action to perform vector search
  retrieval
    .command("fuzz")
    .description("Search using string distance")
    .arguments("<query> [files...]")
    .option("-e, --excluded-files <string...>", "excluded files")
    .option("-k, --top-k <number>", "maximum number of results")
    .option("-s, --min-score <number>", "minimum score")
    .action(retrievalFuzz); // Action to perform fuzzy search

  // Define 'serve' command to start a local server
  const serve = program
    .command("serve")
    .description("Start a GenAIScript local web server")
    .option("--port <number>", `Specify the port number, default: ${SERVER_PORT}`)
    .option("--api-key <string>", "API key to authenticate requests")
    .option("--network", "Opens server on 0.0.0.0 to make it accessible on the network")
    .option(
      "--cors <string>",
      "Enable CORS and sets the allowed origin. Use '*' to allow any origin.",
    )
    .option("--dispatch-progress", "Dispatch progress events to all clients")
    .option(
      "--github-copilot-chat-client",
      "Allow github_copilot_chat provider to connect to connected Visual Studio Code",
    )
    .action(startServer); // Action to start the server
  addRemoteOptions(serve); // Add remote options to the command
  addModelOptions(serve);

  const mcp = program.command("mcp").option("--ids <string...>", "Filter script by ids");
  addGroupsOptions(mcp)
    .option("--startup <string>", "Startup script id, executed after the server is started")
    .alias("mcps")
    .description("Starts a Model Context Protocol server that exposes scripts as tools")
    .action(startMcpServer);
  addRemoteOptions(mcp);
  addModelOptions(mcp);

  const openapi = program
    .command("webapi")
    .option("-n, --network", "Opens server on 0.0.0.0 to make it accessible on the network")
    .option("--port <number>", `Specify the port number, default: ${SERVER_PORT}`)
    .option(
      "--cors <string>",
      "Enable CORS and sets the allowed origin. Use '*' to allow any origin.",
    )
    .option("--route <string>", "Route prefix, like /api")
    .option("--ids <string...>", "Filter script by ids")
    .option("--startup <string>", "Startup script id, executed after the server is started")
    .description(
      "Starts an Web API server that exposes scripts as REST endpoints (OpenAPI 3.1 compatible)",
    )
    .action(startOpenAPIServer);
  addRemoteOptions(openapi);
  addModelOptions(openapi);
  addGroupsOptions(openapi);

  const configureActionCmd = configureCmd
    .command("action")
    .alias("github-action")
    .description("Configure a GitHub repository as a custom dockerized GitHub Action")
    .argument("[script]", "Script id to use as action", "action")
    .option("-f, --force", "force override existing action files")
    .option("-o, --out <string>", "output folder for action files")
    .option("--ffmpeg", "use ffmpeg for video/audio processing")
    .option("--playwright", "Enable Playwright for browser testing")
    .option("--python", "Install Python 3.x support")
    .option("-i, --image <string>", "Docker image identifier")
    .option("--apks <string...>", "Linux packages to install")
    .option("--provider <string>", "LLM provider to use")
    .option("--interactive", "Enable interactive mode")
    .action(actionConfigure);
  configureActionCmd.addOption(
    new Option("-e, --event <string>", "GitHub event type").choices([
      "push",
      "pull_request",
      "issue_comment",
      "issue",
    ]),
  );
  addPullRequestOptions(configureActionCmd); // Add pull request options to the action command

  // Define 'parse' command group for parsing tasks
  const parser = program.command("parse").alias("parsers").description("Parse various outputs");
  const parserData = parser
    .command("data <file>")
    .description(
      "Convert CSV, YAML, TOML, INI, XLSX, XML, MD/X frontmatter or JSON data files into various formats",
    )
    .action(parseAnyToJSON);
  parserData.addOption(
    new Option("-f, --format <string>", "output format").choices([
      "json",
      "json5",
      "yaml",
      "ini",
      "csv",
      "md",
    ]),
  );
  parser
    .command("fence <language> <file>")
    .description("Extracts a code fenced regions of the given type")
    .action(parseFence); // Action to parse fenced code regions
  parser
    .command("pdf <file>")
    .description("Parse a PDF into text and images")
    .option("-i, --images", "extract images")
    .option("-o, --out <string>", "output folder")
    .action(parsePDF); // Action to parse PDF files
  parser
    .command("docx <file>")
    .description("Parse a DOCX into texts")
    .addOption(
      new Option("-f, --format <string>", "output format").choices(["markdown", "html", "text"]),
    )
    .action(parseDOCX); // Action to parse DOCX files
  parser
    .command("html")
    .argument("<file_or_url>", "HTML file or URL")
    .addOption(new Option("-f, --format <string>", "output format").choices(["markdown", "text"]))
    .option("-o, --out <string>", "output file")
    .description("Parse an HTML file to text")
    .action(parseHTMLToText); // Action to parse HTML files
  parser
    .command("tokens")
    .description("Count tokens in a set of files")
    .arguments("<files...>")
    .option("-e, --excluded-files <string...>", "excluded files")
    .action(parseTokens); // Action to count tokens in files
  parser
    .command("tokenize")
    .argument("<file>", "file to tokenize")
    .description("Tokenizes a piece of text and display the tokens (in hex format)")
    .option("-m, --model <string>", "encoding model")
    .action(parseTokenize);
  parser
    .command("jsonl2json", "Converts JSONL files to a JSON file")
    .argument("<file...>", "input JSONL files")
    .action(jsonl2json); // Action to convert JSONL to JSON
  parser
    .command("prompty")
    .description("Converts .prompty files to genaiscript")
    .argument("<file...>", "input JSONL files")
    .option("-o, --out <string>", "output folder")
    .action(prompty2genaiscript); // Action to convert prompty files
  parser
    .command("jinja2")
    .description("Renders Jinja2 or prompty template")
    .argument("<file>", "input Jinja2 or prompty template file")
    .option("-x, --vars <namevalue...>", "variables, as name=value passed to the template")
    .action(parseJinja2);
  parser
    .command("secrets")
    .description("Applies secret scanning and redaction to files")
    .argument("<file...>", "input files")
    .action(parseSecrets);
  parser
    .command("markdown")
    .description("Chunks markdown files")
    .argument("<file>", "input markdown file")
    .option("-m, --model <string>", "encoding model")
    .option("--max-tokens <number>", "maximum tokens per chunk")
    .action(parseMarkdown);

  // Define 'info' command group for utility information tasks
  const info = program.command("info").description("Utility tasks");
  info.command("help").description("Show help for all commands").action(helpAll); // Action to show help for commands
  info.command("system").description("Show system information").action(systemInfo); // Action to show system information
  info
    .command("env")
    .description("Show .env information")
    .arguments("[provider]")
    .option("-t, --token", "show token")
    .option("-e, --error", "show errors")
    .option("-m, --models", "show models if possible")
    .action(envInfo); // Action to show environment information
  const models = program.command("models");
  const modelsList = models
    .command("list", { isDefault: true })
    .description("List all available models")
    .arguments("[provider]");
  modelsList
    .addOption(new Option("-f, --format <string>", "output format").choices(["json", "yaml"]))
    .action(modelList);
  models.command("alias").description("Show model alias mapping").action(modelAliasesInfo);

  program.parse(); // Parse command-line arguments

  function addRemoteOptions(command: Command) {
    return command
      .option("--remote <string>", "Remote repository URL to serve")
      .option("--remote-branch <string>", "Branch to serve from the remote")
      .option("--remote-force", "Force pull from remote repository")
      .option("--remote-install", "Install dependencies from remote repository");
  }

  function addGroupsOptions(command: Command) {
    return command.option(
      "-g, --groups <groups...>",
      "groups to include or exclude. Use :! prefix to exclude",
    );
  }

  function addPullRequestOptions(command: Command) {
    return command
      .option(
        "-n, --pull-request-comment [string]",
        "create comment on a pull request with a unique id (defaults to script id)",
      )
      .option(
        "-d, --pull-request-description [string]",
        "create comment on a pull request description with a unique id (defaults to script id)",
      )
      .option("-r, --pull-request-reviews", "create pull request reviews from annotations");
  }

  function addLogProbsOptions(command: Command) {
    return command
      .option("--logprobs", "enable reporting token probabilities")
      .option("--top-logprobs <number>", "number of top logprobs (1 to 5)");
  }

  function addProviderOptions(command: Command) {
    return command.addOption(
      new Option("-p, --provider <string>", "Preferred LLM provider aliases").choices(
        MODEL_PROVIDERS.filter(({ hidden }) => !hidden).map(({ id }) => id),
      ),
    );
  }

  function addModelOptions(command: Command) {
    return addProviderOptions(command)
      .option("-m, --model <string>", "'large' model alias (default)")
      .option("-s, --small-model <string>", "'small' alias model")
      .option("--vision-model <string>", "'vision' alias model")
      .option("--embeddings-model <string>", "'embeddings' alias model")
      .option("-a, --model-alias <nameid...>", "model alias as name=modelid")
      .addOption(
        new Option("--reasoning-effort <string>", "Reasoning effort for o* models").choices([
          "high",
          "medium",
          "low",
        ]),
      );
  }
}
