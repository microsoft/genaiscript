# Multiple Agents

```mermaid
flowchart LR
    query(["summarize changes in the current branch"]) --> LLM((LLM))

    LLM --> |"get changes in current branch"| agent_git
    agent_git["agent git (LLM, git diff, git branch)"] --> |"diff +main.ts -main.ts...+ new code"| LLM

    LLM --> |"query the last failed run"| agent_github
    agent_github["agent github (LLM, list workflow runs, list jobs, diff job logs)"] --> |"commit failed_sha is responsible"| LLM
```


```js
defAgent("git", "query git", "You are a git god.", {
    tools: ["git_branch", "git_diff"],
})
```

```js
defAgent("github", "query github", "You are a github god.", {
    tools: ["github_pulls", "github_job_log"],
})
```
