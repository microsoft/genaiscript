import { Steps } from "@astrojs/starlight/components"
import { FileTree } from "@astrojs/starlight/components"

[GitHub Actions](https://docs.github.com/en/actions) is a continuous integration and continuous delivery (CI/CD) platform that allows you to automate your build, test, and deployment pipeline. You can create workflows that build and test every pull request to your repository, or deploy merged pull requests to production.

[Recently](https://github.blog/changelog/2025-04-14-github-actions-token-integration-now-generally-available-in-github-models/), GitHub added the ability to use [GitHub Models](https://docs.github.com/en/github-models) in actions as well.

The combo of Actions and Models allows you to run GenAIScript as part of your CI/CD.

:::tip

Jump to the [Custom Actions](#custom-actions) section to learn how to package a GenAIScript script as a GitHub Action.

:::

## Samples

- [GenAI Issue Labeller](https://github.com/pelikhan/action-genai-issue-labeller/)
- [GenAI Issue De-duplicator](https://github.com/pelikhan/action-genai-issue-dedup/)
- [GenAI Video Issue Analyzer](https://github.com/pelikhan/action-genai-video-issue-analyzer/)
- [GenAI Code Commentor](https://github.com/pelikhan/action-genai-commentor/)

## GitHub Models Permissions

[To use Models in a GitHub Action](https://docs.github.com/en/github-models/use-github-models/integrating-ai-models-into-your-development-workflow#using-ai-models-with-github-actions), you need to set the `permissions` for the action to include `models: read`.

```yaml "models: read"
permissions:
    models: read
```

GenAIScript has built-in support for GitHub Models, so you can use it directly in your GitHub Actions workflow.

## Using the CLI

The simplest way to use GenAIScript in a GitHub Action is to run the [CLI](/genaiscript/reference/cli) directly.
You can do this by adding a step to your workflow that runs the `genaiscript` command.

```yaml "npx -y genaiscript run ..."
- uses: actions/setup-node@v4 # make sure node.js is installed
- name: Run GenAIScript
  run: npx -y genaiscript run ...
  env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Make sure to include the `GITHUB_TOKEN` in the environment variables** so that GenAIScript can authenticate with GitHub Models.

```yaml "GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}"
---
run: npx -y genaiscript run ...
env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Custom Actions <a id="custom-actions"></a>

GitHub supports packaging tasks as [custom actions](https://docs.github.com/en/actions/sharing-automations/creating-actions/about-custom-actions), typically in a dedicated repository. This is a great way to package an AI script and share it with others.

```yaml "uses: <owner>/<repo>@<tag>"
- name: Run AI Script
  uses: <owner>/<repo>@<tag>
  with:
      github_token: ${{ secrets.GITHUB_TOKEN }}
```

The GenAIScript CLI provides a command to generate/update the boilerplate code to package a script as a
[Docker container action](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-docker-container-action) so that it can be used in GitHub Actions regardless of the language used to write the script.

To get started,

<Steps>

<ol>

<li>

Create a new repository for your action.

</li>

<li>

Open a terminal in the root of your repository.

</li>

<li>

Run the command to generate the action boilerplate:

```bash
npx -y genaiscript configure action
```

</li>

</ol>

</Steps>

The action boilerplate generator will override the following files:

<FileTree>

- `action.yml` Action metadata file
- `Dockerfile` Dockerfile for the action
- `README.md` Documentation for the action
- `.gitignore` Files to ignore in the repository
- `.github/workflows/ci.yml` CI workflow to test the action
- `package.json` Package configuration for the action
- `devcontainer/devcontainer.json` Devcontainer configuration for VS Code
- `devcontainer/Dockerfile` Devcontainer Dockerfile for VS Code. Must be kept in sync with the action Dockerfile.

</FileTree>

To update the action boilerplate, you can run the same command again:

```bash
npm run configure
```

### Metadata

The `action.yml` file contains metadata about the action. It is mined from various part of your project:

- The `name` is derived from the script id.
- The `description` is derived from the script `title`.
- The `inputs` are derived from the script [parameters](/genaiscript/reference/scripts/parameters) (see below).

Note that the `script.description` is used to populate the `README.md` file.

### Inputs

The `inputs` section of the `action.yml` file is automatically generated from the script parameters.
Each parameter is converted to an input with the same name, and the type is inferred from the parameter type.

```js title="poem.genai.mts"
script({
    title: "A poem generator",
    accept: "none",
    parameters: {
        topic: "nature"
    }
})
$`Write a poem about ${env.vars.topic}`.
```

The generate `action.yml` will look like this:

```yaml title="action.yml"
name: poem
description: Write a poem about nature
inputs:
    topic:
        description: The topic of the poem
        required: false
        default: nature
```

There are also additional fields that are common to all GenAIScript actions:

- `files`: Specify a file path to populate the `env.files` variable. To remove this field, set `accept: "none"` in the script.
- `github_token`: **This is required to authenticate with GitHub Models.**
  It will become `INPUT_GITHUB_TOKEN` when the container is created and GenAIScript will pick it up automatically.
- `github_issue`: The current GitHub issue or pull request number.
- `debug`: The filter to control debug [logging](/genaiscript/reference/scripts/logging) messages.

### Outputs

The action populates a few output fields.

- `text`: this is the generated text from the script.
- `data`: this is the structure output parsed and stringified as JSON. This field is populated
  if you provide a [responseSchema](/genaiscript/reference/scripts/schemas) in the script and if the LLM is able to generate a response that matches the schema.

### Branding

The `script` `branding` field is used to [customize the appearance of the action in the GitHub UI](https://docs.github.com/en/actions/sharing-automations/creating-actions/metadata-syntax-for-github-actions?versionId=free-pro-team%40latest&productId=actions&restPage=sharing-automations%2Ccreating-actions%2Creleasing-and-maintaining-actions#branding).

```js
script({
    branding: {
        icon: "pencil",
        color: "blue",
    },
})
```

### Containers

By default, GenAIScript uses [node:lts-alpine](https://hub.docker.com/_/node/) as the base image for the action container.
You can change this by specifying a different base image in the `cli`.

```dockerfile "--image <image>"
npx -y genaiscript configure action ... --image <image>
```

GenAIScript will also create a [devcontainer](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
so that you can develop the action in the (almost same) containerized environment as when it runs in the GitHub Action.

### ffmpeg, playwright and other packages

To keep the action container small, GenAIScript does not include `ffmpeg`, `playwright` or other packages by default.
You can add them to the container by specifying them in the `cli` command.

```bash "--ffmpeg --playwright"
npx -y genaiscript configure action ... --ffmpeg --playwright
```

You can also add any other packages you need by specifying them in the `cli` command.

```bash "--apks <package1> <package2>"
npx -y genaiscript configure action ... --apks <package1> <package2>
```

### Testing the Action

Your script should be testable locally using the `npm run dev` command. Feel free to edit it in `package.json`.

```bash
npm run dev
```

Or if you want to simulate the GitHub Action environment,
you can set the `INPUT_<parameter>` variables in the environment.

```bash
INPUT_TOPIC=nature genaiscript run poem
```

### GitHub Workspace vs Action Workspace

When running the action in a container, the content of the action repository
is first copied in the `/github/action` directory. GitHub clones the repository to the `/github/workspace` directory.

The `Dockerfile` `ENTRYPOINT` is configured to launch the `genaiscript` cli in the `/github/action` directory
and then it sniffs for the `GITHUB_WORKSPACE` environment variable to determine the working directory
and changes the `cwd` to it.

This mode is enabled by the `--github-workspace` flag in the `cli` command.