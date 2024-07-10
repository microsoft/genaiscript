# Pull Request Reviewer

Build your own PR reviewer!

- get branch history using `git`
- let LLM request additional files using tools (`system.fs_read_file`)
- use instructions to tune the quality of the answers

```js
script({ ..., system: ["system", "system.fs_find_files", "system.fs_read_file"],})

const { stdout: changes } = await host.exec("git", ["diff", "main"])
def("GIT_DIFF", changes, { language: "diff", maxTokens: 20000, })

$`You are an expert software developer and architect.
## Task
- Describe a high level summary of the changes in GIT_DIFF in a way that a software engineer will understand.
## Instructions
- try to extract the intent of the changes, don't focus on the details
...`
```

Let GenAISCript upsert a comment on your Pull Request (GitHub, Azure DevOps**)

```sh
genaiscript run pr-review --pull-request-comment
```

** soonish
