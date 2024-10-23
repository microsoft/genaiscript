---
layout: two-cols-header
---

# Agent Tool = nested LLM + Tools

-   **Agent orchestration left to the LLM**
-   Agent tool description augment with nested tool description (not id!)

::left::

```mermaid {scale: 0.8}
flowchart LR
    query(["summarize changes in the current branch"]) --> LLM((LLM))

    LLM --> |"get changes in current branch"| agent_git
    agent_git --> |"diff +main.ts -main.ts...+ new code"| LLM

    subgraph agent_git ["agent git"]
        agent_git_LLM((LLM)) <--> git_tools["git branch, git diff"]
    end
```

::right::

- definition

```js
defTool(
    "agent_git",
    "Agent that can query git",
    { query: { type: "string" } },
    async ({ query }) =>
        prompt`You are a git god. Answer ${query}.`.options({
            tools: ["git_branch", "git_diff"],
        })
)
```

- usage

```js
script({ tools: ["agent_git"]})
...
```
