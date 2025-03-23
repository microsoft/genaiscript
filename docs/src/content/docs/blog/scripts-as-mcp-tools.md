---
title: Scripts as MCP tools!
description: Learn how GenAIScript can now surface any script as a MCP tool.
date: 2025-03-22
authors:
    - pelikhan
tags:
    - MCP
canonical_url: https://microsoft.github.io/genaiscript/blog/scripts-as-mcp-tools
---

🚀 The Model Context Protocol (MCP) is taking the tech world by storm, and we're thrilled to announce that GenAIScript is at the forefront of this revolution!

With the rapid adoption of MCP, tools like GitHub Copilot Chat are already integrating support (available in Insiders today), and Copilot Studio has just announced their support as well. 

To keep up with these exciting advancements, **[GenAIScript now allows you to expose scripts as MCP tools](/genaiscript/reference/scripts/mcp-server)**. Imagine the possibilities! MCP tools function similarly to LLM tools, where the Language Model (LLM) decides when to call them, making your development process smarter and more efficient.

```mermaid

graph TD
    VS[GitHub Copilot Chat] --> MCPServer[GenAIScript = MCP Server]
    MCPServer --> MCPTools1[script A = MCP Tool]
    MCPServer --> MCPTools2[script B = MCP Tool]

```


Dive into the future of scripting with GenAIScript and MCP. Check out the [documentation](/genaiscript/reference/scripts/mcp-server) to get started.

