# GenAIScript CLI

## run

Usage: genaiscript run [options] <tool> [spec...]

Runs a GenAIScript against a GPSpec

Options:
  -o, --out <string>               output file. Extra markdown fields for
                                   output and trace will also be generated
  -ot, --out-trace <string>        output file for trace
  -oa, --out-annotations <string>  output file for annotations (.csv will be
                                   rendered as csv)
  -ocl, --out-changelog <string>   output file for changelogs
  -j, --json                       emit full JSON response to output
  -y, --yaml                       emit full YAML response to output
  -d, --dry-run                    dry run, don't execute LLM and return
                                   expanded prompt
  -fe, --fail-on-errors            fails on detected annotation error
  -r, --retry <number>             number of retries (default: "8")
  -rd, --retry-delay <number>      minimum delay between retries (default:
                                   "15000")
  -md, --max-delay <number>        maximum delay between retries (default:
                                   "180000")
  -l, --label <string>             label for the run
  -ghi, --github-issues            create a github issues for errors
  -t, --temperature <number>       temperature for the run
  -m, --model <string>             model for the run
  -se, --seed <number>             seed for the run
  -ae, --apply-edits               apply file edits
  --no-cache                       disable LLM result cache
  --cs, --csv-separator <string>   csv separator (default: "\t")
  -h, --help                       display help for command

## keys

Usage: genaiscript keys [options] [command]

Manage OpenAI keys

Options:
  -h, --help      display help for command

Commands:
  show            Parse and show current key information
  help [command]  display help for command
The OpenAI configuration keys can be set in various ways:

-   set the GENAISCRIPT_TOKEN environment variable. The format is 'https://base-url#key=secret-token'
-   set the OPENAI_API_BASE, OPENAI_API_KEY environment variables. OPENAI_API_TYPE is optional or must be 'azure' and OPENAI_API_VERSION is optional or must be '2023-03-15-preview'.
-   '.env' file with the same variables


## tools

Usage: genaiscript tools [options] [command]

Manage GenAIScript

Options:
  -h, --help      display help for command

Commands:
  list            List all available tools
  help [command]  display help for command

## specs

Usage: genaiscript specs [options] [command]

Manage GPSpecs

Options:
  -h, --help      display help for command

Commands:
  list            List all available specs
  help [command]  display help for command

## convert

Usage: genaiscript convert [options] <path>

Convert HTML files or URLs to markdown format

Options:
  -o, --out <string>  output directory
  -h, --help          display help for command

## help-all

Usage: genaiscript help-all [options]

Show help for all commands

Options:
  -h, --help  display help for command
