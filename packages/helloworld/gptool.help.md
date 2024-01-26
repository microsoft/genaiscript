# GPTools CLI

## run

Usage: gptools run [options] <tool> [spec...]

Runs a GPTools against a GPSpec

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
