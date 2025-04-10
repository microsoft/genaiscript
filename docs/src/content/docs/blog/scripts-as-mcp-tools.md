---
title: Scripts as MCP tools!
description: Learn how GenAIScript can now surface any script as a MCP tool.
date: 2025-03-22
authors:
  - pelikhan
tags:
  - MCP
canonical_url: https://microsoft.github.io/genaiscript/blog/scripts-as-mcp-tools
cover:
  alt: Imagine an 8-bit style scene showing a futuristic, tech-heavy landscape. In
    the center, there's a large, geometric server block labeled "GenAIScript MCP
    Server," connected to two smaller devices tagged as "script A MCP Tool" and
    "script B MCP Tool." A line connects "GitHub Copilot Chat" to the main
    server, representing integration. The design is minimalist with only five
    colors, emitting a corporate, high-tech feeling without any human figures or
    text.
  image: ./scripts-as-mcp-tools.png
excerpt: The Model Context Protocol (MCP) is reshaping how we approach
  integration with AI-driven tools. Platforms like GitHub Copilot Chat and
  Copilot Studio are leading adoption efforts, and GenAIScript is now enabling
  you to expose scripts as MCP tools, streamlining workflows with smarter
  decision-making by LLMs. Ready to elevate your development process? Explore
  the details in the documentation.

---

🚀 The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is taking the tech world by storm, and we're thrilled to announce that GenAIScript is at the forefront of this revolution!

With the rapid adoption of MCP, tools like GitHub Copilot Chat are already integrating support (available in Insiders today), and [Copilot Studio](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/introducing-model-context-protocol-mcp-in-copilot-studio-simplified-integration-with-ai-apps-and-agents/) has just announced their support as well.

To keep up with these exciting advancements, **[GenAIScript now allows you to expose scripts as MCP tools](/genaiscript/reference/scripts/mcp-server)**. Imagine the possibilities! MCP tools function similarly to LLM tools, where the Language Model (LLM) decides when to call them, making your development process smarter and more efficient.

```mermaid

graph TD
    VS[GitHub Copilot Chat] --> MCPServer[GenAIScript = MCP Server]
    MCPServer --> MCPTools1[script A = MCP Tool]
    MCPServer --> MCPTools2[script B = MCP Tool]

```

Dive into the future of scripting with GenAIScript and MCP. Check out the [documentation](/genaiscript/reference/scripts/mcp-server) to get started.
