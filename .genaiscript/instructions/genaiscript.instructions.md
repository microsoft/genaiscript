---
applyTo: '**/*.genai.js,**/*.genai.ts,**/*.genai.mjs,**/*.genai.mts'
---
## GenAIScript Code Generation Instructions

GenAIScript is a custom runtime for node.js that provides AI-powered automation, scripting, and agent capabilities. It supports TypeScript syntax, ESM modules, and async/await patterns.

- GenAIScript documentation: https://microsoft.github.io/genaiscript/llms-full.txt

## Core Principles for GitHub Copilot Integration

- **Agent-First Approach**: Leverage built-in agents for complex tasks rather than implementing custom logic
- **Tool Composition**: Combine multiple tools and agents to solve problems efficiently
- **Context-Aware**: Use file context, git history, and GitHub data effectively
- **Incremental Development**: Build scripts step-by-step with clear, testable components

## Code Generation Guidelines

- Generate TypeScript code using ESM modules for Node.JS
- Prefer GenAIScript APIs from `genaiscript.d.ts` over native Node.js imports
- Keep code simple and focused - avoid unnecessary exception handling
- Add `TODOs` for uncertain implementations that require user review
- Global types from genaiscript.d.ts are pre-loaded - no imports needed
- Save generated code in `./genaisrc` folder with `.genai.mts` extension

## Built-in Agents & Tools

### Primary Agents for GitHub Copilot Chat
- `agent_fs`: File system operations (find, read, search files)
- `agent_git`: Git repository queries and operations
- `agent_github`: GitHub API interactions (issues, PRs, actions)
- `agent_web`: Web scraping and content retrieval
- `agent_data`: Data analysis and processing

### Specialized Agents
- `agent_interpreter`: Python code execution and data analysis
- `agent_docs`: Documentation generation and analysis
- `agent_planner`: Task planning and decomposition
- `agent_video`: Video processing and transcription

## Common Patterns for GitHub Copilot

### Repository Analysis
```typescript
script({
    title: "Analyze repository structure",
    tools: ["agent_fs", "agent_git"]
})

$`Analyze the current repository structure and identify:
- Main technologies and frameworks used
- Code organization patterns
- Potential improvement areas`
```

### GitHub Workflow Debugging
```typescript
script({
    title: "Debug GitHub Actions failure",
    tools: ["agent_github", "agent_git"]
})

$`Investigate the latest failed GitHub Actions run and:
- Identify the root cause of failure
- Compare with recent successful runs
- Suggest specific fixes`
```

### Code Review Assistant
```typescript
script({
    title: "Code review analysis",
    tools: ["agent_fs", "agent_git", "agent_github"]
})

$`Review the current pull request and provide:
- Code quality assessment
- Security considerations
- Performance implications
- Documentation suggestions`
```

## Advanced Features

### Multi-Agent Workflows
Combine agents for complex tasks:
```typescript
script({
    title: "Full repository health check",
    tools: ["agent_fs", "agent_git", "agent_github", "agent_data"]
})
```

### Context-Aware Scripts
Leverage GitHub Copilot Chat context:
```typescript
// Access user selection
const selection = env.vars["copilot.selection"]
// Access current file
const currentFile = env.vars["copilot.editor"]
// Access referenced files
def("FILES", env.files)
```

### Schema-Driven Outputs
Use structured outputs for better integration:
```typescript
defSchema("ANALYSIS_RESULT", {
    type: "object",
    properties: {
        issues: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
        priority: { type: "string", enum: ["low", "medium", "high"] }
    }
})
```
