---
title: Commands
description: List of all CLI commands
sidebar:
  order: 100
---

A full list of the CLI command and its respective help text.

## `configure`

```
Usage: genaiscript configure [options] [command]

Configure LLMs or GitHub Actions

Options:
  -p, --provider <string>                  Preferred LLM provider aliases (choices: "openai", "azure", "azure_ai_inference", "azure_serverless", "azure_serverless_models", "github", "ollama", "windows", "anthropic", "anthropic_bedrock", "google", "huggingface", "mistral", "alibaba", "deepseek", "lmstudio", "docker", "jan", "llamafile", "sglang", "vllm", "litellm", "whisperasr", "echo")
  -h, --help                               display help for command

Commands:
  llm                                      Configure LLM providers
  action|github-action [options] [script]  Configure a GitHub repository as a custom dockerized GitHub Action
```

### `configure llm`

```
Usage: genaiscript configure llm [options]

Configure LLM providers

Options:
  -h, --help  display help for command
```

### `configure action`

```
Usage: genaiscript configure action|github-action [options] [script]

Configure a GitHub repository as a custom dockerized GitHub Action

Arguments:
  script                                   Script id to use as action (default: "action")

Options:
  -f, --force                              force override existing action files
  -o, --out <string>                       output folder for action files
  --ffmpeg                                 use ffmpeg for video/audio processing
  --playwright                             Enable Playwright for browser testing
  --python                                 Install Python 3.x support
  -i, --image <string>                     Docker image identifier
  --apks <string...>                       Linux packages to install
  --provider <string>                      LLM provider to use
  --interactive                            Enable interactive mode
  -e, --event <string>                     GitHub event type (choices: "push", "pull_request", "issue_comment", "issue")
  -n, --pull-request-comment [string]      create comment on a pull request with a unique id (defaults to script id)
  -d, --pull-request-description [string]  create comment on a pull request description with a unique id (defaults to script id)
  -r, --pull-request-reviews               create pull request reviews from annotations
  -h, --help                               display help for command
```

## `run`

```
Usage: genaiscript run [options] <script> [files...]

Runs a GenAIScript against files.

Options:
  --accept <string>                        comma separated list of accepted file extensions
  -p, --provider <string>                  Preferred LLM provider aliases (choices: "openai", "azure", "azure_ai_inference", "azure_serverless", "azure_serverless_models", "github", "ollama", "windows", "anthropic", "anthropic_bedrock", "google", "huggingface", "mistral", "alibaba", "deepseek", "lmstudio", "docker", "jan", "llamafile", "sglang", "vllm", "litellm", "whisperasr", "echo")
  -m, --model <string>                     'large' model alias (default)
  -s, --small-model <string>               'small' alias model
  --vision-model <string>                  'vision' alias model
  --embeddings-model <string>              'embeddings' alias model
  -a, --model-alias <nameid...>            model alias as name=modelid
  --reasoning-effort <string>              Reasoning effort for o* models (choices: "high", "medium", "low")
  --logprobs                               enable reporting token probabilities
  --top-logprobs <number>                  number of top logprobs (1 to 5)
  -e, --excluded-files <string...>         excluded files
  --ignore-git-ignore                      by default, files ignored by .gitignore are excluded. disables this mode
  --fallback-tools                         Enable prompt-based tools instead of builtin LLM tool calling builtin tool calls
  -o, --out <string>                       output folder. Extra markdown fields for output and trace will also be generated
  --remove-out                             remove output folder if it exists
  --out-trace <string>                     output file for trace
  --out-output <string>                    output file for output
  --out-data <string>                      output file for data (.jsonl/ndjson will be aggregated). JSON schema information and validation will be included if available.
  --out-annotations <string>               output file for annotations (.csv will be rendered as csv, .jsonl/ndjson will be aggregated)
  --out-changelog <string>                 output file for changelogs
  -n, --pull-request-comment [string]      create comment on a pull request with a unique id (defaults to script id)
  -d, --pull-request-description [string]  create comment on a pull request description with a unique id (defaults to script id)
  -r, --pull-request-reviews               create pull request reviews from annotations
  --teams-message                          Posts a message to the teams channel
  -j, --json                               emit full JSON response to output
  --fail-on-errors                         fails on detected annotation error
  --retry <number>                         number of retries (default: "10")
  --retry-delay <number>                   minimum delay between retries (default: "1000")
  --max-delay <number>                     maximum delay between retries (default: "60000")
  --max-retry-after <number>               maximum retry-after delay in milliseconds before giving up (default: "300000")
  -l, --label <string>                     label for the run
  -t, --temperature <number>               temperature for the run
  --top-p <number>                         top-p for the run
  --max-tokens <number>                    maximum completion tokens for the run
  --max-data-repairs <number>              maximum data repairs
  --max-tool-calls <number>                maximum tool calls for the run
  --tool-choice <string>                   tool choice for the run, 'none', 'auto', 'required', or a function name
  --seed <number>                          seed for the run
  -c, --cache                              enable LLM result cache
  --cache-name <name>                      custom cache file name
  --csv-separator <string>                 csv separator (default: "\t")
  --fence-format <string>                  fence format (choices: "xml", "markdown", "none")
  -y, --apply-edits                        apply file edits
  -x, --vars <namevalue...>                variables, as name=value, stored in env.vars. Use environment variables GENAISCRIPT_VAR_name=value to pass variable through the environment
  --run-retry <number>                     number of retries for the entire run
  --no-run-trace                           disable automatic trace generation
  --no-output-trace                        disable automatic output generation
  -h, --help                               display help for command
```

## `runs`

```
Usage: genaiscript runs [options] [command]

Commands to open previous runs

Options:
  -h, --help      display help for command

Commands:
  list [script]   List all available run reports in workspace
  help [command]  display help for command
```

### `runs list`

```
Usage: genaiscript runs list [options] [script]

List all available run reports in workspace

Arguments:
  script      Script id

Options:
  -h, --help  display help for command
```

## `test`

```
Usage: genaiscript test|eval [options] [command]

Options:
  -h, --help                 display help for command

Commands:
  run [options] [script...]  Runs the tests for scripts
  list [options]             List available tests in workspace
  view                       Launch test viewer
  help [command]             display help for command
```

### `test run`

```
Usage: genaiscript test run [options] [script...]

Runs the tests for scripts

Arguments:
  script                         Script ids. If not provided, all scripts are
                                 tested

Options:
  --redteam                      run red team tests
  -p, --provider <string>        Preferred LLM provider aliases (choices:
                                 "openai", "azure", "azure_ai_inference",
                                 "azure_serverless", "azure_serverless_models",
                                 "github", "ollama", "windows", "anthropic",
                                 "anthropic_bedrock", "google", "huggingface",
                                 "mistral", "alibaba", "deepseek", "lmstudio",
                                 "docker", "jan", "llamafile", "sglang", "vllm",
                                 "litellm", "whisperasr", "echo")
  -m, --model <string>           'large' model alias (default)
  -s, --small-model <string>     'small' alias model
  --vision-model <string>        'vision' alias model
  --embeddings-model <string>    'embeddings' alias model
  -a, --model-alias <nameid...>  model alias as name=modelid
  --reasoning-effort <string>    Reasoning effort for o* models (choices:
                                 "high", "medium", "low")
  --models <models...>           models to test where mode is the key value pair
                                 list of m (model), s (small model), t
                                 (temperature), p (top-p)
  --max-concurrency <number>     maximum concurrency (default: "1")
  -o, --out <folder>             output folder
  --remove-out                   remove output folder if it exists
  --cli <string>                 override path to the cli
  --test-delay <string>          delay between tests in seconds
  --cache                        enable LLM result cache
  -r, --random                   Randomize test order
  -v, --verbose                  verbose output
  --promptfoo-version [version]  promptfoo version, default is 0.112.7
  --out-summary <file>           append output summary in file
  -g, --groups <groups...>       groups to include or exclude. Use :! prefix to
                                 exclude
  --test-timeout <number>        test timeout in seconds
  -h, --help                     display help for command
```

### `test list`

```
Usage: genaiscript test list [options]

List available tests in workspace

Options:
  --redteam                 list red team tests
  -g, --groups <groups...>  groups to include or exclude. Use :! prefix to
                            exclude
  -h, --help                display help for command
```

### `test view`

```
Usage: genaiscript test view [options]

Launch test viewer

Options:
  -h, --help  display help for command
```

## `convert`

```
Usage: genaiscript convert [options] <script> [files...]

Converts file through a GenAIScript. Each file is processed separately through
the GenAIScript and the LLM output is saved to a <filename>.genai.md (or custom
suffix).

Options:
  -u, --suffix <string>             suffix for converted files
  -r, --rewrite                     rewrite input file with output (overrides
                                    suffix)
  -w, --cancel-word <string>        cancel word which allows the LLM to notify
                                    to ignore output
  -e, --excluded-files <string...>  excluded files
  --ignore-git-ignore               by default, files ignored by .gitignore are
                                    excluded. disables this mode
  -p, --provider <string>           Preferred LLM provider aliases (choices:
                                    "openai", "azure", "azure_ai_inference",
                                    "azure_serverless",
                                    "azure_serverless_models", "github",
                                    "ollama", "windows", "anthropic",
                                    "anthropic_bedrock", "google",
                                    "huggingface", "mistral", "alibaba",
                                    "deepseek", "lmstudio", "docker", "jan",
                                    "llamafile", "sglang", "vllm", "litellm",
                                    "whisperasr", "echo")
  -m, --model <string>              'large' model alias (default)
  -s, --small-model <string>        'small' alias model
  --vision-model <string>           'vision' alias model
  --embeddings-model <string>       'embeddings' alias model
  -a, --model-alias <nameid...>     model alias as name=modelid
  --reasoning-effort <string>       Reasoning effort for o* models (choices:
                                    "high", "medium", "low")
  --fallback-tools                  Enable prompt-based tools instead of builtin
                                    LLM tool calling builtin tool calls
  -o, --out <string>                output folder. Extra markdown fields for
                                    output and trace will also be generated
  -x, --vars <namevalue...>         variables, as name=value, stored in
                                    env.vars. Use environment variables
                                    GENAISCRIPT_VAR_name=value to pass variable
                                    through the environment
  -c, --cache                       enable LLM result cache
  --cache-name <name>               custom cache file name
  --concurrency <number>            number of concurrent conversions
  --no-run-trace                    disable automatic trace generation
  --no-output-trace                 disable automatic output generation
  -h, --help                        display help for command
```

## `scripts`

```
Usage: genaiscript scripts|script [options] [command]

Utility tasks for scripts

Options:
  -h, --help                  display help for command

Commands:
  list [options] [script...]  List all available scripts in workspace
  create [options] [name]     Create a new script
  fix [options]               Write TypeScript definition files in the script
                              folder to enable type checking.
  compile [folders...]        Compile all scripts in workspace
  model [options] [script]    List model connection information for scripts
  help|info <script>          Show help information for a script
```

### `scripts list`

```
Usage: genaiscript scripts list [options] [script...]

List all available scripts in workspace

Arguments:
  script                    Script ids

Options:
  --unlisted                show unlisted scripts
  --json                    output in JSON format
  -g, --groups <groups...>  groups to include or exclude. Use :! prefix to
                            exclude
  -h, --help                display help for command
```

### `scripts create`

```
Usage: genaiscript scripts create [options] [name]

Create a new script

Arguments:
  name              Name of the script

Options:
  -t, --typescript  Generate TypeScript file (.genai.mts) (default: true)
  -h, --help        display help for command
```

### `scripts fix`

```
Usage: genaiscript scripts fix [options]

Write TypeScript definition files in the script folder to enable type checking.

Options:
  --github-copilot-instructions  Write GitHub Copilot custom instructions for
                                 better GenAIScript code generation
  --docs                         Download documentation
  --force                        Fix all folders, including built-in system
                                 scripts
  -h, --help                     display help for command
```

### `scripts compile`

```
Usage: genaiscript scripts compile [options] [folders...]

Compile all scripts in workspace

Arguments:
  folders     Pattern to match files

Options:
  -h, --help  display help for command
```

### `scripts model`

```
Usage: genaiscript scripts model [options] [script]

List model connection information for scripts

Arguments:
  script       Script id or file

Options:
  -t, --token  show token
  -h, --help   display help for command
```

### `scripts help`

```
Usage: genaiscript scripts help|info [options] <script>

Show help information for a script

Arguments:
  script      Script id

Options:
  -h, --help  display help for command
```

## `cache`

```
Usage: genaiscript cache [options] [command]

Cache management

Options:
  -h, --help      display help for command

Commands:
  clear [name]    Clear cache
  help [command]  display help for command
```

### `cache clear`

```
Usage: genaiscript cache clear [options] [name]

Clear cache

Arguments:
  name        Name of the cache, tests

Options:
  -h, --help  display help for command
```

## `video`

```
Usage: genaiscript video [options] [command]

Video tasks

Options:
  -h, --help                       display help for command

Commands:
  probe <file>                     Probes metadata from a video/audio file
  extract-audio [options] <file>   Transcode video/audio file
  extract-frames [options] <file>  Extract video frames
  help [command]                   display help for command
```

### `video probe`

```
Usage: genaiscript video probe [options] <file>

Probes metadata from a video/audio file

Arguments:
  file        Audio or video file to inspect

Options:
  -h, --help  display help for command
```

### `video extract-audio`

```
Usage: genaiscript video extract-audio [options] <file>

Transcode video/audio file

Arguments:
  file                 Audio or video file to transcode

Options:
  -t, --transcription  Convert audio for speech-to-text
  -h, --help           display help for command
```

### `video extract-frames`

```
Usage: genaiscript video extract-frames [options] <file>

Extract video frames

Arguments:
  file                            Audio or video file to transcode

Options:
  -k, --keyframes                 Extract only keyframes (intra frames)
  -t, --scene-threshold <number>  Extract frames with a minimum threshold
  -c, --count <number>            maximum number of frames to extract
  -s, --size <string>             size of the output frames wxh
  -f, --format <string>           Image file format
  -h, --help                      display help for command
```

## `retrieval`

```
Usage: genaiscript retrieval [options] [command]

RAG support

Options:
  -h, --help                                  display help for command

Commands:
  index [options] <name> <files...>           Index files for vector search
  vector|search [options] <query> [files...]  Search using vector embeddings similarity
  fuzz [options] <query> [files...]           Search using string distance
  help [command]                              display help for command
```

### `retrieval index`

```
Usage: genaiscript retrieval index [options] <name> <files...>

Index files for vector search

Options:
  -e, --excluded-files <string...>  excluded files
  --ignore-git-ignore               by default, files ignored by .gitignore are
                                    excluded. disables this mode
  -g, --embeddings-model <string>   'embeddings' alias model
  --database <string>               Type of database to use for indexing
                                    (choices: "local", "azure_ai_search")
  -h, --help                        display help for command
```

### `retrieval vector`

```
Usage: genaiscript retrieval vector|search [options] <query> [files...]

Search using vector embeddings similarity

Options:
  -e, --excluded-files <string...>  excluded files
  -k, --top-k <number>              maximum number of results
  -s, --min-score <number>          minimum score
  -h, --help                        display help for command
```

### `retrieval fuzz`

```
Usage: genaiscript retrieval fuzz [options] <query> [files...]

Search using string distance

Options:
  -e, --excluded-files <string...>  excluded files
  -k, --top-k <number>              maximum number of results
  -s, --min-score <number>          minimum score
  -h, --help                        display help for command
```

## `serve`

```
Usage: genaiscript serve [options]

Start a GenAIScript local web server

Options:
  --port <number>                Specify the port number, default: 8003
  --api-key <string>             API key to authenticate requests
  --network                      Opens server on 0.0.0.0 to make it accessible
                                 on the network
  --cors <string>                Enable CORS and sets the allowed origin. Use
                                 '*' to allow any origin.
  --chat                         Enable OpenAI compatible chat completion routes
                                 (/v1/chat/completions)
  --dispatch-progress            Dispatch progress events to all clients
  --github-copilot-chat-client   Allow github_copilot_chat provider to connect
                                 to connected Visual Studio Code
  --remote <string>              Remote repository URL to serve
  --remote-branch <string>       Branch to serve from the remote
  --remote-force                 Force pull from remote repository
  --remote-install               Install dependencies from remote repository
  -p, --provider <string>        Preferred LLM provider aliases (choices:
                                 "openai", "azure", "azure_ai_inference",
                                 "azure_serverless", "azure_serverless_models",
                                 "github", "ollama", "windows", "anthropic",
                                 "anthropic_bedrock", "google", "huggingface",
                                 "mistral", "alibaba", "deepseek", "lmstudio",
                                 "docker", "jan", "llamafile", "sglang", "vllm",
                                 "litellm", "whisperasr", "echo")
  -m, --model <string>           'large' model alias (default)
  -s, --small-model <string>     'small' alias model
  --vision-model <string>        'vision' alias model
  --embeddings-model <string>    'embeddings' alias model
  -a, --model-alias <nameid...>  model alias as name=modelid
  --reasoning-effort <string>    Reasoning effort for o* models (choices:
                                 "high", "medium", "low")
  -h, --help                     display help for command
```

## `mcp`

```
Usage: genaiscript mcp|mcps [options]

Starts a Model Context Protocol server that exposes scripts as tools

Options:
  --ids <string...>              Filter script by ids
  -g, --groups <groups...>       groups to include or exclude. Use :! prefix to
                                 exclude
  --startup <string>             Startup script id, executed after the server is
                                 started
  --remote <string>              Remote repository URL to serve
  --remote-branch <string>       Branch to serve from the remote
  --remote-force                 Force pull from remote repository
  --remote-install               Install dependencies from remote repository
  -p, --provider <string>        Preferred LLM provider aliases (choices:
                                 "openai", "azure", "azure_ai_inference",
                                 "azure_serverless", "azure_serverless_models",
                                 "github", "ollama", "windows", "anthropic",
                                 "anthropic_bedrock", "google", "huggingface",
                                 "mistral", "alibaba", "deepseek", "lmstudio",
                                 "docker", "jan", "llamafile", "sglang", "vllm",
                                 "litellm", "whisperasr", "echo")
  -m, --model <string>           'large' model alias (default)
  -s, --small-model <string>     'small' alias model
  --vision-model <string>        'vision' alias model
  --embeddings-model <string>    'embeddings' alias model
  -a, --model-alias <nameid...>  model alias as name=modelid
  --reasoning-effort <string>    Reasoning effort for o* models (choices:
                                 "high", "medium", "low")
  -h, --help                     display help for command
```

## `webapi`

```
Usage: genaiscript webapi [options]

Starts an Web API server that exposes scripts as REST endpoints (OpenAPI 3.1
compatible)

Options:
  -n, --network                  Opens server on 0.0.0.0 to make it accessible
                                 on the network
  --port <number>                Specify the port number, default: 8003
  --cors <string>                Enable CORS and sets the allowed origin. Use
                                 '*' to allow any origin.
  --route <string>               Route prefix, like /api
  --ids <string...>              Filter script by ids
  --startup <string>             Startup script id, executed after the server is
                                 started
  --remote <string>              Remote repository URL to serve
  --remote-branch <string>       Branch to serve from the remote
  --remote-force                 Force pull from remote repository
  --remote-install               Install dependencies from remote repository
  -p, --provider <string>        Preferred LLM provider aliases (choices:
                                 "openai", "azure", "azure_ai_inference",
                                 "azure_serverless", "azure_serverless_models",
                                 "github", "ollama", "windows", "anthropic",
                                 "anthropic_bedrock", "google", "huggingface",
                                 "mistral", "alibaba", "deepseek", "lmstudio",
                                 "docker", "jan", "llamafile", "sglang", "vllm",
                                 "litellm", "whisperasr", "echo")
  -m, --model <string>           'large' model alias (default)
  -s, --small-model <string>     'small' alias model
  --vision-model <string>        'vision' alias model
  --embeddings-model <string>    'embeddings' alias model
  -a, --model-alias <nameid...>  model alias as name=modelid
  --reasoning-effort <string>    Reasoning effort for o* models (choices:
                                 "high", "medium", "low")
  -g, --groups <groups...>       groups to include or exclude. Use :! prefix to
                                 exclude
  -h, --help                     display help for command
```

## `parse`

```
Usage: genaiscript parse|parsers [options] [command] <file...>

Parse various outputs

Arguments:
  file                          input JSONL files

Options:
  -h, --help                    display help for command

Commands:
  data [options] <file>         Convert CSV, YAML, TOML, INI, XLSX, XML, MD/X
                                frontmatter or JSON data files into various
                                formats
  fence <language> <file>       Extracts a code fenced regions of the given type
  pdf [options] <file>          Parse a PDF into text and images
  docx [options] <file>         Parse a DOCX into texts
  html [options] <file_or_url>  Parse an HTML file to text
  tokens [options] <files...>   Count tokens in a set of files
  tokenize [options] <file>     Tokenizes a piece of text and display the tokens
                                (in hex format)
  jsonl2json                    Converts JSONL files to a JSON file
  prompty [options] <file...>   Converts .prompty files to genaiscript
  jinja2 [options] <file>       Renders Jinja2 or prompty template
  secrets <file...>             Applies secret scanning and redaction to files
  markdown [options] <file>     Chunks markdown files
```

### `parse data`

```
Usage: genaiscript parse data [options] <file>

Convert CSV, YAML, TOML, INI, XLSX, XML, MD/X frontmatter or JSON data files
into various formats

Options:
  -f, --format <string>  output format (choices: "json", "json5", "yaml", "ini",
                         "csv", "md")
  -h, --help             display help for command
```

### `parse fence`

```
Usage: genaiscript parse fence [options] <language> <file>

Extracts a code fenced regions of the given type

Options:
  -h, --help  display help for command
```

### `parse pdf`

```
Usage: genaiscript parse pdf [options] <file>

Parse a PDF into text and images

Options:
  -i, --images        extract images
  -o, --out <string>  output folder
  -h, --help          display help for command
```

### `parse docx`

```
Usage: genaiscript parse docx [options] <file>

Parse a DOCX into texts

Options:
  -f, --format <string>  output format (choices: "markdown", "html", "text")
  -h, --help             display help for command
```

### `parse html`

```
Usage: genaiscript parse html [options] <file_or_url>

Parse an HTML file to text

Arguments:
  file_or_url            HTML file or URL

Options:
  -f, --format <string>  output format (choices: "markdown", "text")
  -o, --out <string>     output file
  -h, --help             display help for command
```

### `parse tokens`

```
Usage: genaiscript parse tokens [options] <files...>

Count tokens in a set of files

Options:
  -e, --excluded-files <string...>  excluded files
  -h, --help                        display help for command
```

### `parse tokenize`

```
Usage: genaiscript parse tokenize [options] <file>

Tokenizes a piece of text and display the tokens (in hex format)

Arguments:
  file                  file to tokenize

Options:
  -m, --model <string>  encoding model
  -h, --help            display help for command
```

### `parse jsonl2json`

```
Usage: genaiscript parse jsonl2json [options]

Converts JSONL files to a JSON file

Options:
  -h, --help  display help for command
```

### `parse prompty`

```
Usage: genaiscript parse prompty [options] <file...>

Converts .prompty files to genaiscript

Arguments:
  file                input JSONL files

Options:
  -o, --out <string>  output folder
  -h, --help          display help for command
```

### `parse jinja2`

```
Usage: genaiscript parse jinja2 [options] <file>

Renders Jinja2 or prompty template

Arguments:
  file                       input Jinja2 or prompty template file

Options:
  -x, --vars <namevalue...>  variables, as name=value passed to the template
  -h, --help                 display help for command
```

### `parse secrets`

```
Usage: genaiscript parse secrets [options] <file...>

Applies secret scanning and redaction to files

Arguments:
  file        input files

Options:
  -h, --help  display help for command
```

### `parse markdown`

```
Usage: genaiscript parse markdown [options] <file>

Chunks markdown files

Arguments:
  file                   input markdown file

Options:
  -m, --model <string>   encoding model
  --max-tokens <number>  maximum tokens per chunk
  -h, --help             display help for command
```

## `info`

```
Usage: genaiscript info [options] [command]

Utility tasks

Options:
  -h, --help                display help for command

Commands:
  help                      Show help for all commands
  system                    Show system information
  env [options] [provider]  Show .env information
```

### `info help`

```
Usage: genaiscript info help [options]

Show help for all commands

Options:
  -h, --help  display help for command
```

### `info system`

```
Usage: genaiscript info system [options]

Show system information

Options:
  -h, --help  display help for command
```

### `info env`

```
Usage: genaiscript info env [options] [provider]

Show .env information

Options:
  -t, --token   show token
  -e, --error   show errors
  -m, --models  show models if possible
  -h, --help    display help for command
```

## `models`

```
Usage: genaiscript models [options] [command]

Options:
  -h, --help                 display help for command

Commands:
  list [options] [provider]  List all available models
  alias                      Show model alias mapping
  help [command]             display help for command
```

### `models list`

```
Usage: genaiscript models list [options] [provider]

List all available models

Options:
  -f, --format <string>  output format (choices: "json", "yaml")
  -h, --help             display help for command
```

### `models alias`

```
Usage: genaiscript models alias [options]

Show model alias mapping

Options:
  -h, --help  display help for command
```
