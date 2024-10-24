
Runs a script on files and streams the LLM output to stdout or a folder from the workspace root.

```bash
npx genaiscript run <script> "<files...>"
```

where `<script>` is the id or file path of the tool to run, and `[spec]` is the name of the spec file to run it on.

Files can also include [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) pattern.

```sh
npx genaiscript run code-annotator "src/*.ts"
```

If multiple files are specified, all files are included in `env.files`.

```sh
npx genaiscript run <script> "src/*.bicep" "src/*.ts"
```

## Credentials

The LLM connection configuration is read from environment variables or from a `.env` file in the workspace root directory.

See [configuration](/genaiscript/getting-started/configuration).

## Files

`run` takes one or more [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) patterns to match files in the workspace.

```bash sh
npx genaiscript run <script> "**/*.md" "**/*.ts"
```

### --excluded-files &lt;files...&gt;

Excludes the specified files from the file set.

```sh "--excluded-files <excluded-files...>"
npx genaiscript run <script> <files> --excluded-files <excluded-files...>
```

### --exclude-git-ignore

Exclude files ignored by the `.gitignore` file at the workspace root.

```sh "--exclude-git-ignore"
npx genaiscript run <script> <files> --exclude-git-ignore
```

## Output

### --prompt

Skips the LLM invocation and only prints the expanded system and user chat messages.

### --out &lt;file|directory&gt;

Saves the results in a JSON file, along with markdown files of the output and the trace.

```sh "--out tmp"
npx genaiscript run <script> <files> --out out/res.json
```

If `file` does not end with `.json`, the path is treated as a directory path.

```sh "--out tmp"
npx genaiscript run <script> <files> --out tmp
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
npx genaiscript run <script> <files> --out-trace &lt;file&gt;
```

In a GitHub Actions workflow, you can use this feature to save the trace as a step summary (`GITHUB_STEP_SUMMARY`):

```yaml
- name: Run GenAIScript tool on spec
  run: |
      genaiscript run <script> <files> --out-trace $GITHUB_STEP_SUMMARY
```

### --out-annotations &lt;file&gt;

Emit annotations in the specified file as a JSON array, JSON Lines, [SARIF](https://sarifweb.azurewebsites.net/) or a CSV file if the file ends with `.csv`.

```sh
npx genaiscript run <script> <files> --out-annotations diags.csv
```

Use JSON lines (`.jsonl`) to aggregate annotations from multiple runs in a single file.

```sh
npx genaiscript run <script> <files> --out-annotations diags.jsonl
```

### --out-data &lt;file&gt;

Emits parsed data as JSON, YAML or JSONL. If a JSON schema is specified
and availabe, the JSON validation result is also stored.

```sh
npx genaiscript run <script> <files> --out-data data.jsonl
```

### --out-changelogs &lt;file&gt;

Emit changelogs in the specified file as text.

```sh
npx genaiscript run <script> <files> --out-changelogs changelogs.txt
```

## Pull Requests

The CLI can update pull request description and comments when running in a GitHub Action or Azure DevOps pipeline.

### GitHub Action workflow configuration

Update your workflow configuration to include the following:

-   add the `pull-requests: write` permission to the workflow/step

```yaml
permissions:
    pull-requests: write
```

-   set the `GITHUB_TOKEN` secret in the `env` when running the cli

```yaml
    - run: npx --yes genaiscript run ... -prc --out-trace $GITHUB_STEP_SUMMARY
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ... # LLM secrets
```

### Azure DevOps configuration

-   add `<your projectname> Build Service` in the **Collaborator** role to the repository
-   pass secrets to scripts, including `System.AccessToken`

```yaml
- script: npx genaiscript run ... -prd
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
    ... # LLM secrets
```

### --pull-request-description \[tag\]

When running within a GitHub Action or Azure DevOps pipeline on a pull request,
the CLI inserts the LLM output in the description of the pull request ([example](https://github.com/microsoft/genaiscript/pull/564))

```sh
npx genaiscript run ... -prd
```

The `tag` parameter is a unique id used to differentiate description generate by different runs. Default is the script id.

### --pull-request-comment \[tag\];

Upserts a comment on the pull request with the LLM output ([example](https://github.com/microsoft/genaiscript/pull/564#issuecomment-2200474305))

```sh
npx genaiscript run ... -prc
```

The `tag` parameter is a unique id used to differentiate description generate by different runs. Default is the script id.

### --pull-request-reviews

Create pull request review comments from each [annotations](/genaiscript/reference/scripts/annotations)
([example](https://github.com/microsoft/genaiscript/pull/564#pullrequestreview-2151692644)).

```sh
npx genaiscript run ... -prr
```

## Read more

The full list of options is available in the [CLI reference](/genaiscript/reference/cli/commands#run).
