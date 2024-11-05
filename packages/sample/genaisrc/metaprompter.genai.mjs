script({
    title: "Meta-prompt generator",
    system: [
        "system",
        "system.assistant",
        "system.safety_jailbreak",
        "system.safety_protected_material",
    ],
    tools: ["agent_docs", "agent_fs", "agent_planner"],
})

$`
## Task

Generate a meta-prompt that will teach an LLM how to use the library in this repository.

- Use the planner agent to refine the plan to solve the task
- Analyze the samples for example of API use
- Generate a meta-prompt that will teach an LLM how to use the library in this repository

## Guidance

- Be exhaustive
- Use the documentation to ground your answers on how to use the APIs

## File structure

- samples: javascript/typescript files under packages/sample/src/**/*.m*s
- documentation: markdown files under docs/src/content/docs/**/*.md*

`
