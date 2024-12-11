
import { Steps } from "@astrojs/starlight/components"
import { FileTree } from "@astrojs/starlight/components"
import { Image } from "astro:assets"
import { Code } from "@astrojs/starlight/components"
import prDescribeSrc from "../../../../../packages/sample/genaisrc/pr-describe.genai.mjs?raw"

Once you have a script that you are happy with, you can automate it using the [command line interface](/genaiscript/reference/cli).

## Running a script using the CLI

The basic usage of the CLI is to [run](/genaiscript/reference/cli/run/) a script with a tool name and a list of files.

```sh wrap
npx --yes genaiscript run <script> <...files>
```

The CLI will use the secrets in the `.env` file, populate `env.files` with `<...files>`, run the script
and emit the output to the standard output.

:::tip

[npx](https://docs.npmjs.com/cli/v10/commands/npx) allows you to run a command
from the [genaiscript npm package](https://www.npmjs.com/package/genaiscript) (either one installed locally, or fetched remotely).
Add `--yes` flag to automatically agree to any prompts without confirmation.

:::

You can use the CLI to run your scripts in a CI/CD pipeline.
The CLI will return a non-zero exit code if the script fails, which can be used to fail the pipeline.

### Apply Edits

Add the `--apply-edits` flag to the CLI to automatically write the file edits.

```sh wrap "--apply-edits"
npx --yes genaiscript run <script> <...files> --apply-edits
```

:::caution

An LLM may generate arbitrary code that can be harmful to your system.
We recommend that you review the modified code before executing it. This could be done through a separate
branch and a pull request. You can also use a [container](/genaiscript/reference/scripts/container)
to run the script in a sandboxed environment.

Refer to [Security and Trust](/genaiscript/reference/security-and-trust) for more discussion.

:::

## GitHub Action

[GitHub Actions](https://docs.github.com/en/actions) is a continuous integration and continuous delivery (CI/CD)
platform that allows you to automate your build, test, and deployment pipeline.
This section explains how to integrate your GenAIScript in GitHub Actions workflows and pull requests.

### Configure secrets and variables

Configure the [secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
and [variables](https://docs.github.com/en/actions/learn-github-actions/variables)
on your repository or organization so that GenAIScript can connect to your LLM.

The secrets and variables should match the `.env` file in your local environment.

### Running a script

Use the [cli](/genaiscript/reference/cli/run/) to run the script in a GitHub Action.

-   Make sure to pass the secrets and variables to the script to give access to the LLM.
-   use the `--out <path>` flag to store the results in a directory so that you can upload them as an artifact.

```yaml
- run: npx --yes genaiscript run <script> <...files> --out genairesults
  env:
      # variables
      OPENAI_API_TYPE: ${{ env.OPENAI_API_TYPE }}
      OPENAI_API_BASE: ${{ env.OPENAI_API_BASE }}
      # secret, redacted
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Add the trace to the action summary

Use the `out-trace` flag to output the trace to the summary file, `$GITHUB_STEP_SUMMARY`
(see [example](https://github.com/microsoft/genaiscript/actions/runs/9370477073#summary-25797526178)).

```yaml "--out-trace $GITHUB_STEP_SUMMARY"
- run: npx --yes genaiscript run ... --out-trace $GITHUB_STEP_SUMMARY
```

### Diff

You can use `host.exec` to execute [git]() command to retrieve changes in the current branch.

```js
const { stdout: changes } = await host.exec("git", [
    "diff",
    "main",
    "--",
    ":!**/genaiscript.d.ts",
    ":!**/jsconfig.json",
    ":!genaisrc/*",
    ":!.github/*",
    ":!.vscode/*",
    ":!*yarn.lock",
])

def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 20000,
})
```

Note that you'll need to pull `origin/main` branch to make this command work in an action.

```yaml
- run: git fetch origin && git pull origin main:main
```

### Storing output in artifacts

Ensure that the directory containing the results is uploaded as an artifact. You can review the trace by opening the `res.trace.md` file.
in the zipped artifact.

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
      path: |
          genairesults/**
```

### Azure OpenAI with a Service Principal

The official documentation of the [azure login action](https://github.com/Azure/login?tab=readme-ov-file#azure-login-action)
contains detailled steps on configure Azure resource access from GitHub Actions.

:::note

The [login with OpenID Connect (OIDC)](https://github.com/Azure/login?tab=readme-ov-file#login-with-openid-connect-oidc-recommended) is the recommended solution
in the Azure documentation pages.

The steps below show how to configure the Azure login action to access the OpenAI resource **using a Service Principal client secret**.

:::

<Steps>

<ol>

<li>

Create a Service Principal following [connect from azure secret](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-secret#prerequisites) guide.

</li>
<li>

Assign any role to the service principal (e.g. **Reader**) in your Azure subscription. You need this to login.

</li>
<li>

Assign the role **Cognitive Services OpenAI User** to the service principal. You need this so that the service principal can access the OpenAI resource.

</li>

<li>

Configure the [AZURE_CREDENTIALS](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-secret#create-a-github-secret-for-the-service-principal)
secret in your GitHub repository with the service principal credentials.

```json
{
    "clientId": "<Client ID>",
    "clientSecret": "<Client Secret>",
    "subscriptionId": "<Subscription ID>",
    "tenantId": "<Tenant ID>"
}
```

</li>

<li>

Configure the `AZURE_OPENAI_API_ENDPOINT` in your repository GitHub Action variables.

</li>

<li>

Add the following step in your workflow to your GitHub action to login to Azure.

```yaml title="genai.yml"
- name: Azure Login action
  uses: azure/login@v2
  with:
      creds: ${{ secrets.AZURE_CREDENTIALS }}
```

</li>

<li>

Update each step that invokes the [cli](/genaiscript/reference/cli) to include the `AZURE_OPENAI_API_ENDPOINT` variable.

```yaml
- name: run genai script
  run: npx --yes genaiscript run ...
  env:
      AZURE_OPENAI_API_ENDPOINT: ${{ env.AZURE_OPENAI_API_ENDPOINT }}
```

</li>

</ol>

</Steps>

## GitHub Pull request

If your GitHub Action is triggered by a [pull request event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request),
you can use the following flags to add comments: description, conversation and reviews.

In order to create comments,
the workflow must have the `pull-requests: write` [permission](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs)
and the `GITHUB_TOKEN` secret must be passed to the script.

```yaml
permissions:
    pull-requests: write
...
    - run: npx --yes genaiscript run ...
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ...
```

### Update Description

The `--pull-request-description` inserts the LLM output into the pull request section (see [example](https://github.com/microsoft/genaiscript/pull/504)).
The command takes an optional string argument to uniquely identify this comment, it is used to update the comment (default is the script id).

```yaml "--pull-request-description"
- run: npx --yes genaiscript run --pull-request-description
```

If you want to run this script when the pull request is ready for review, use the [`ready_for_review`](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request), `opened`, `reopened` events.

```yaml
on:
    pull_request:
        types: [ready_for_review, opened, reopened]
```

:::note

The comment is enclosed in two XML comments (`<genaiscript begin [id]>`, `<genaiscript end [id]>`)
to allow for easy identification and removal. Make sure to keep those.

:::

### Conversation comment

The `--pull-request-comment` adds the LLM output as a comment to the pull request conversation (see [example](https://github.com/microsoft/genaiscript/pull/504#issuecomment-2145273728)).
The optional argument is an identifier for the comment (default is the script id) so that only one comment appears for the id.

```yaml "--pull-request-comment"
- run: npx --yes genaiscript run --pull-request-comment
  env: ...
```

### Review comments

Use the `--pull-request-reviews` to convert [annotations](/genaiscript/reference/scripts/annotations) as review comments
**to the last commit** on the pull request (see [example](https://github.com/microsoft/genaiscript/pull/504#pullrequestreview-2093960791)).

```yaml "--pull-request-reviews"
- run: npx --yes genaiscript run --pull-request-reviews
  env: ...
```

GenAIScript will automatically try to ignore duplicate review comments and only create new ones.

To collect the changes of the last commit in the pull request branch (see [cool blog post](https://www.kenmuse.com/blog/the-many-shas-of-a-github-pull-request/)), you can try this git command:

```js
const { stdout: changes } = await host.exec("git", [
    "diff",
    "HEAD^",
    "HEAD",
    "--",
    "**.ts",
])
```
