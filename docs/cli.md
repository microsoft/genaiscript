# CLI

The GPTools CLI is a command line packaged as a Node.JS javascript file. It is used to run GPTools from the command line.

-   Download `gptools.js` from the [latest release assets](https://github.com/microsoft/gptools/releases/latest).

## run a tool on a spec

Runs a gptool on a gpspec file and prints the LLM output.

```bash
node gptools.js <tool> [spec]
```

where `<tool>` is the id or file path of the tool to run, and `[spec]` is the name of the spec file to run it on.
If `[spec]` is not specified, the `stdin` content is used as the spec. If `[spec]` is not a `.gpspec.md` file,
a wrapper spec is generated on the fly.

### credentials

The token is read from the environment `GPTOOLS_TOKEN`, from `OPENAI_API_KEY/BASE` keys or
or configured through the `keys` command (as a JSON payload).

### --output <file>

Saves the results in a JSON file, along with mardown files of the output and the trace.

```bash
node gptools.js <tool> <spec> --output <file>
```

### --retry <number>

Specifies the number of retries when the LLM invocations fails with throttling (429).
Default is 3.

### --retry-delay <number>

Minimum delay between retries in milliseconds.

### --json

Output the entire response as JSON to the stdout.

## `tools`, manage GPtools

### gptools tools list

Lists the tools available in the current workspace.

## `specs`, manage GPSpecs

### gptools specs list

Lists the specs available in the current workspace.

## `keys`, manage OpenAI Token

Commands to manage the OpenAI token on file. You can also use the `GPTOOLS_TOKEN` environment variable.

### gptools keys set <token>

Stores the OpenAI token in `.gptools/tmp/token.json`.

### gptools keys clear

Clears the OpenAI token from `.gptools/tmp/token.json`.

### gptools keys list

Shows information about the current key.
