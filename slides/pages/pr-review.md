# Example: Pull Request

Build your own PR description generator!

<v-click>

-   get branch history using `git`

```js
const { stdout: changes } = await host.exec("git", ["diff", "main"])
def("GIT_DIFF", changes, { language: "diff", maxTokens: 20000 })
```

</v-click>

<v-click>

-   use instructions to tune the quality of the answers

```js
$`You are an expert software developer and architect.
## Task
- Describe a high level summary of the changes in GIT_DIFF in a way that a software engineer will understand.
## Instructions
- try to extract the intent of the changes, don't focus on the details
...`
```

</v-click>

<v-click>

-   extend LLM with tools to read files (`fs_read_file`)

```js
script({ ..., tools: ["fs_read_file"],})
```

</v-click>


<v-click>

-   update pull request description (GitHub Actions, Azure DevOps)

```sh
genaiscript run pr-review --pull-request-description
```

</v-click>
