import { Code } from '@astrojs/starlight/components';
import scriptSrc from "../../../../../packages/sample/genaisrc/git-release-notes.genai?raw"

There are plenty of automated `release notes` generator
that inspect the list of commits since the last release and generate a list of changes.
The release notes are typically exclusively based on the commit messages.

In the GenAIScript project, we create a release notes generator **that uses 
both commit history and the diff of the changes**.

You can see one of the first prototype generated 
release notes for [v1.41.6](https://github.com/microsoft/genaiscript/releases/tag/1.41.6).

```markdown wrap
We are excited to announce the release of GenAIScript 1.41.6! 🎉

In this release, we've made some significant improvements to enhance your experience. Here are the key changes:

Improved Release Script: We've fine-tuned our release script to ensure smoother and more efficient releases in the future. 🛠️
...

```

## Commit history and diff

We start our script by calling `git` a few times to retrieve the previous release tag,
the list of commits, and the diff since the tag. 
(This magic was mostly found using a GitHub Copilot Chat session).

```js title="git-release-notes.genai.mjs" wrap
const { stdout: tag } = await host.exec(`git describe --tags --abbrev=0 HEAD^`)

const { stdout: commits } = await host.exec(`git log HEAD...${tag}`)

const { stdout: diff } = await host.exec(`git diff ${tag}..HEAD`)

```

We use the `def` function with `maxTokens` to inline this information without exceeding the content window
of the model (32k input).

```js title="git-release-notes.genai.mjs" wrap
def("COMMITS", commits, { maxTokens: 4000 })
def("DIFF", diff, { maxTokens: 20000 })
```

## Role and task

The rest of the script follows a typical pattern with a role and a task.

```js wrap
$`
You are an expert software developer and release manager.

## Task

Generate a clear, exciting, relevant, useful release notes
for the upcoming release. 

- The commits in the release are in COMMITS.
- The diff of the changes are in DIFF.
`
```


## The script

The full script as it is running in GenAIScript is as follows:

<Code code={scriptSrc} wrap={true} lang="js" title="git-release-notes.genai.mjs" />

## Release-it integration

GenAIScript uses [release-it](https://github.com/release-it/release-it)
to automate the release process. We configured release-it to run the script using the [cli](/genaiscript/reference/cli)
 by adding a `github.releaseNotes` field in the `release-it` configuration.

```json title="package.json" wrap
 "release-it": {
     "github": {
         "releaseNotes": "npx --yes genaiscript run git-release-notes"
     }
 }
```