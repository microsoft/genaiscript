# CLI

The GPTools CLI is a command line packaged as a Node.JS javascript file. It is used to run GPTools from the command line.

-   Download `gptools.js` from the [latest release assets](https://github.com/microsoft/gptools/releases/latest).

## run a tool on a spec

Runs a gptool on a gpspec file and prints the LLM output.

```bash
node gptools.js <tool> <file>
```

### --output <file>

Saves the results in a JSON file, along with mardown files of the output and the trace.

```bash
node gptools.js <tool> <file> --output <file>
```

## `tools`, manage GPtools

### gptools tools list

Lists the tools available in the current workspace.

## `specs`, manage GPSpecs

### gptools specs list

Lists the specs available in the current workspace.

## `keys`, manage OpenAI Token

### gptools keys set <token>

Stores the OpenAI token in `.gptools/tmp/token.json`.

### gptools keys clear

Clears the OpenAI token from `.gptools/tmp/token.json`.

### gptools keys list

Shows information about the current key.
