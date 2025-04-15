---
title: '"How to Expose a Script as an MCP Tool in GenAIScript"'
date: 2025-04-15
authors: genaiscript
draft: true
tags:
  - genaiscript
  - mcp
  - scripting
  - automation
  - tutorial

---

# "How to Expose a Script as an MCP Tool in GenAIScript"

Model Context Protocol (MCP) is an emerging standard for interoperable tooling in AI-powered applications. GenAIScript makes it exceptionally easy to expose scripts as MCP-compliant tools—enabling seamless integration and chaining of intelligent capabilities. In this post, let's walk through an annotated example that shows exactly how to write a GenAIScript prompt generation script that exposes itself as an MCP tool. 🚀

---

## Script Overview

Here's the complete script we'll be explaining line by line:

```js
script({
    title: "MCP Example: Exposing a Script as a Model Context Protocol Tool",
    description: "This script demonstrates how to expose a GenAIScript script as a Model Context Protocol (MCP) tool, including parameters, output, and annotations.",
    group: "mcp",
    parameters: {
        input: {
            type: "string",
            description: "Input for the MCP tool.",
            required: true
        }
    },
    annotations: {
        readOnlyHint: true,
        openWorldHint: true
    }
})

const { input } = env.vars

// Optionally, publish a resource that will be available via MCP
const resourceId = await host.publishResource("Echoed input", input)

// Output the result using env.output or top-level context
output.fence(`Echo: ${input}\nResource URI: ${resourceId}`)
```

---

## Line-by-Line Explanation

### 1️⃣ Script Metadata

```js
script({
    title: "MCP Example: Exposing a Script as a Model Context Protocol Tool",
    description: "This script demonstrates how to expose a GenAIScript script as a Model Context Protocol (MCP) tool, including parameters, output, and annotations.",
    group: "mcp",
    parameters: {
        input: {
            type: "string",
            description: "Input for the MCP tool.",
            required: true
        }
    },
    annotations: {
        readOnlyHint: true,
        openWorldHint: true
    }
})
```

- **`script({ ... })`**  
  This top-level call configures your script's metadata and interface. Everything inside the object tailors how the script appears and behaves as an MCP tool.

- **`title` & `description`**  
  These describe your script for users and other tools. The title is shown in UIs and dashboards. The description should briefly explain what the tool does.

- **`group`**  
  This logical grouping ("mcp" here) helps organize your scripts—especially useful for large script libraries.

- **`parameters`**  
  Each property under `parameters` is an input your script accepts. Here, `input` is a required string. Tools and users will be prompted for this value.

- **`annotations`**  
  - `readOnlyHint: true`: Declares this tool does not modify external state, making it safe for broad usage.
  - `openWorldHint: true`: Indicates the tool's results may reference or generate resources outside its own container—for instance, published files or links.

*For more on script metadata and annotations, see the [GenAIScript documentation](https://microsoft.github.io/genaiscript/docs/script-metadata).*

---

### 2️⃣ Grabbing Parameters

```js
const { input } = env.vars
```

- **`env.vars`**  
  This global object contains all user-supplied parameter values. Here, we're extracting the value of the required `input` parameter.

*Parameter handling details can be found in the [API Reference](https://microsoft.github.io/genaiscript/docs/reference/api#parameters).*

---

### 3️⃣ MCP Resource Publishing

```js
const resourceId = await host.publishResource("Echoed input", input)
```

- **`host.publishResource(label, content)`**  
  MCP tools can publish resources for downstream tools or agents to use. Here, the input is published as a named resource with the label "Echoed input". The resulting `resourceId` is a unique URI that can be referenced in MCP workflows.

- **`await`**  
  Resource publishing is asynchronous, so we use `await` to pause execution until the resource is available.

*Resource management API details: [Publishing Resources](https://microsoft.github.io/genaiscript/docs/reference/api#publishing-resources).*

---

### 4️⃣ Outputting the Result

```js
output.fence(`Echo: ${input}\nResource URI: ${resourceId}`)
```

- **`output.fence`**  
  This helper formats your result in a code block, making it easy to read in conversational or script-driven interfaces.

- **Result Structure**  
  - The original input is echoed back, giving immediate feedback.
  - The published `Resource URI` is displayed, so users or agents can grab the resulting resource for further processing.

*More on output: [Script Output](https://microsoft.github.io/genaiscript/docs/output).*

---

## Wrapping Up 🎉

With just a few clear steps, you can expose any GenAIScript script as an interoperable MCP tool: describe inputs and behaviors, process parameters, (optionally) publish resources, and output results in a standardized format.

Try adapting this pattern for your own intelligent utilities, and check out more [examples in the samples folder](https://github.com/microsoft/genaiscript/tree/main/packages/sample/src). Happy scripting!

---

For more details, visit the [official documentation](https://microsoft.github.io/genaiscript/). 🚦