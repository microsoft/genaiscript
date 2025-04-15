---
title: How to Expose and Consume MCP Tools in GenAIScript
date: 2025-04-15
authors: genaiscript
draft: true
tags:
  - genaiscript
  - mcp
  - ai-scripting
  - automation

---

# How to Expose and Consume MCP Tools in GenAIScript 🚀

GenAIScript makes it easy to connect, expose, and use tools across different models and protocols. One of its powerful features is the Model Context Protocol (MCP) integration, enabling scripts to both **expose** themselves as MCP tools and **consume** external MCP tools seamlessly. In this walkthrough, we’ll break down a practical example script, explain each section line by line, and help you understand how to write such scripts for your own automation needs.

## 📜 Example Script Breakdown

Let’s examine, step by step, how this script works to expose a GenAIScript as a MCP tool, and then consume another MCP tool as a client. Each line brings a unique functionality to the overall flow!

---

```javascript
script({
    title: "MCP Example Script",
    description: "Demonstrates how to expose a GenAIScript as a Model Context Protocol (MCP) tool and consume MCP tools as a client.",
    group: "mcp",
    parameters: {
        task: {
            type: "string",
            description: "A task to perform using the MCP tool.",
            required: true
        }
    },
    annotations: {
        readOnlyHint: true,
        openWorldHint: true
    },
    mcpServers: {
        memory: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"]
        }
    }
})
```

### Line-by-Line Explanation

1. **`script({...})`**

   This is the primary function that defines all metadata and configuration for the GenAIScript. For more info, see the [GenAIScript documentation](https://microsoft.github.io/genaiscript/docs/reference/script/).

2. **`title`, `description`, `group`**

   - `title` gives your script a clear name.
   - `description` provides context for other users (or yourself) about the script's purpose.
   - `group` is a categorization label—handy for organizing related scripts (in this case, it's `"mcp"`).

3. **`parameters`**

   Here, you define the user-supplied variables your script needs.  
   - `task` is a **required** string describing the task to be performed using the MCP tool.

4. **`annotations`**

   - `readOnlyHint: true` signals that the script might be safe for read-only environments.
   - `openWorldHint: true` suggests the script may connect or interact beyond the current workspace—useful for awareness!

5. **`mcpServers`**

   The real MCP magic!  
   This block defines which MCP servers your script exposes or interacts with.  
   - Key: `memory` (that's the MCP tool name)
   - `command`: `"npx"` launches a Node.js package runner
   - `args`: These arguments launch the [`@modelcontextprotocol/server-memory`](https://www.npmjs.com/package/@modelcontextprotocol/server-memory) MCP memory server, providing a simple key-value store.

---

```javascript
const { task } = env.vars
```

6. **Destructuring User Input**

   Here, the `task` parameter received from the user or calling process is extracted from `env.vars`.  
   This is the string that will later be stored or processed.

---

```javascript
// Example: Use the MCP memory server tool
const memoryTool = tools.memory_store || tools["memory_store"]
if (memoryTool) {
    const storeRes = await memoryTool({ key: "task", value: task })
    $`Stored task in memory: ${JSON.stringify(storeRes)}`
} else {
    $`No memory tool available. Task: ${task}`
}
```

7. **Consuming the MCP Memory Tool**

   - **`tools.memory_store`**: This variable references the MCP tool registered as `"memory_store"`. The script checks both dot notation and bracket notation for flexibility.
   - If the memory tool is present, it calls the tool as a function, passing `{ key: "task", value: task }`. This stores the `task` string in the memory MCP server under the key `"task"`.
   - **Awaiting the result**: The call is asynchronous (`await`). The script then interpolates the result into a statement acknowledging the storage.
   - If the MCP memory server isn’t available, the script logs a fallback message, simply outputting the task that would have been saved.

---

## 🌐 Why Use MCP with GenAIScript?

- **Interoperability:** Easily connects your script with external tools, databases, or microservices via a standardized protocol.
- **Modularity:** Lets you consume or compose a wide array of tools—swap memory stores, semantic reasoning, or custom endpoints at will.
- **Reusability:** Scripts can be both "servers" (exposing capabilities) and "clients" (using capabilities)—all with minimal configuration.

## 🧑‍💻 Learn More

- See more example scripts in [packages/sample/src/](https://github.com/microsoft/genaiscript/tree/main/packages/sample/src/)  
- Consult the official [GenAIScript docs](https://microsoft.github.io/genaiscript/) for deep dives.
- Learn about [Model Context Protocol (MCP)](https://modelcontext.org/) for open protocol details.

---

Empower your automations by making your GenAIScripts MCP-ready—both as providers and consumers of powerful tools!  

Happy scripting! ✨