---
title: Run
description: Learn how to execute genai scripts on files with streaming output to stdout, including usage of glob patterns, environment variables, and output options.
sidebar:
    order: 1
keywords: CLI tool execution, genai script running, stdout streaming, file globbing, environment configuration
---

Runs a script on files and streams the LLM output to stdout.

```bash
npx genaiscript run <script> "<files...>"
```

where `<script>` is the id or file path of the tool to run, and `[spec]` is the name of the spec file to run it on.

If `spec` is not a `.gpspec.md` file, a wrapper spec is generated on the fly. In this case, spec can also be a [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) patterns.

```sh
npx genaiscript run code-annotator "src/*.ts"
```

If multiple files are specified, all files are included in `env.files`.

```sh
npx genaiscript run <script> "src/*.bicep" "src/*.ts"
```

### Credentials

The LLM connection configuration is read from environment variables or from a `.env` file in the workspace root directory.

See [configuration](/genaiscript/getting-started/configuration).

### --excluded-files <files...>

Excludes the specified files from the file set.

```sh
npx genaiscript run <script> <spec> --excluded-files <excluded-files...>
```

### --out <file|directory>

Saves the results in a JSON file, along with markdown files of the output and the trace.

```sh
npx genaiscript run <script> <spec> --out output/results.json
```

If `file` does not end with `.json`, the path is treated as a directory path.

```sh
npx genaiscript run <script> <spec> --out output
```

### --json

Output the entire response as JSON to the stdout.

### --yaml

Output the entire response as YAML to the stdout.

### --vars name=value name2=value2 ...

Populate values in the `env.vars` map that can be used when running the prompt.

### --out-trace &lt;file&gt;

Save the markdown trace to the specified file.

```sh
npx genaiscript run <script> <spec> --out-trace &lt;file&gt;
```

In a GitHub Actions workflow, you can use this feature to save the trace as a step summary (`GITHUB_STEP_SUMMARY`):

```yaml
- name: Run GenAIScript tool on spec
  run: |
      genaiscript run <script> <spec> --out-trace $GITHUB_STEP_SUMMARY
```

### --out-annotations &lt;file&gt;

Emit annotations in the specified file as a JSON array, JSON Lines, [SARIF](https://sarifweb.azurewebsites.net/) or a CSV file if the file ends with `.csv`.

```sh
npx genaiscript run <script> <spec> --out-annotations diags.csv
```

Use JSON lines (`.jsonl`) to aggregate annotations from multiple runs in a single file.

```sh
npx genaiscript run <script> <spec> --out-annotations diags.jsonl
```

### --out-data &lt;file&gt;

Emits parsed data as JSON, YAML or JSONL. If a JSON schema is specified
and availabe, the JSON validation result is also stored.

```sh
npx genaiscript run <script> <spec> --out-data data.jsonl
```

### --out-changelogs &lt;file&gt;

Emit changelogs in the specified file as text.

```sh
npx genaiscript run <script> <spec> --out-changelogs changelogs.txt
```

### --prompt

Skips the LLM invocation and only prints the expanded system and user chat messages.

### --retry &lt;number&gt;

Specifies the number of retries when the LLM invocations fails with throttling (429).
Default is 3.

### --retry-delay &lt;number&gt;

Minimum delay between retries in milliseconds.

### --label &lt;label&gt;

Adds a run label that will be used in generating the trace title.

### --cache

Enables LLM caching in JSONL file under `.genaiscript/tmp/openai.genaiscript.cjsonl`. Caching is enabled by default in VSCode
but not for the CLI.

### --temperature &lt;number&gt;

Overrides the LLM run temperature.

### --top-p &lt;number&gt;

Overrides the LLM run `top_p` value.

### --model &lt;string&gt;

Overrides the LLM model identifier.

### --apply-edits

Apply file modifications to the file system.

### --source-map

Generate a source map for the script sources to allow debugging.
