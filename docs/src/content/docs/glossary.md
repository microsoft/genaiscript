---
title: Glossary
description: A glossary of terms used in the GenAI project.
keywords: glossary, terms, definitions
sidebar:
    order: 200
---

This glossary provides definitions for terms used in the project.
Each term is linked to its corresponding section in the documentation for easy reference.

> This glossary is auto-generated from the source files.

## Terms

- **About mixing files and --vars**: Order of CLI arguments for specifying files and variables.
- **Additional flags**: Repo clone flags: `--remote-branch <branch>` to specify branch, `--remote-force` to force overwrite, `--remote-nstall` to install dependencies after cloning.
- **Astro**: Astro is a modern static site generator for building fast, optimized websites using any framework.
- **Authentication**: Supports secrets via environment variables and Microsoft Entra authentication.
- **Azure AI Foundry**: Platform for building and deploying AI models.
- **Azure AI Inference**: [Azure AI Inference](/genaiscript/getting-started/configuration/)
- **Azure AI Search**: Hybrid vector and keyword search engine.
- **Azure AI Serverless Models**: [Azure AI Serverless Models](/genaiscript/getting-started/configuration/)
- **Azure Content Safety**: Service for detecting and filtering harmful content in applications.
- **Azure OpenAI and AI services**: Enables GenAIScript to run LLM inference within Azure AI Foundry.
- **Azure OpenAI Serverless**: [Azure OpenAI Serverless](/genaiscript/getting-started/configuration/)
- **Capabilities**: Lets teams, including non-developers, create and debug AI-enhanced JavaScript scripts calling LLMs and foundation models.
- **Compile scripts**: Runs TypeScript compiler to check scripts for errors.
- **config file resolution**: Process by which GenAIScript scans and merges settings from configuration files.
- **Configuration**: CLI loads secrets from environment variables or a `./.env` file.
- **Create a new script**: Command to generate a new script file in the `genaisrc` folder.
- **debugging**: Enable the debug category in config to view more information on configuration resolution.
- **envFile**: Specifies the environment file to load secrets as environment variables.
- **Foundation models and LLMs**: GenAIScript supports multiple LLMs and plans to include other foundation models beyond language models.
- **GenAIScript**: GenAIScript is a scripting language that makes LLMs a first-class part of the scripting process, enabling users to author, debug, and deploy LLM-powered scripts for tasks beyond conventional code.
- **GenAIScript CLI**: `genaiscript` command-line tool for running scripts outside VS Code and [automation](/genaiscript/getting-started/automating-scripts).
- **GPVM**: Runtime system for executing GenAIScript, integrating context into prompts, calling specified LLMs, and extracting results.
- **Helper scripts**: `package.json` entries ensuring correct TypeScript definition file generation for scripts.
- **include**: Glob pattern setting to include additional scripts and allow sharing across projects.
- **Launching**: From the workspace root, run `npx --yes genaiscript serve` and go to the provided URL (typically `http://127.0.0.1:8003/`).
- **List of script configuration**: Lists scripts and model configurations for CI/CD troubleshooting.
- **Listing model configuration**: Lists available scripts and model configurations for CI/CD troubleshooting.
- **Local installation**: To avoid `npx` slowness, install locally with `npm install -g genaiscript`.
- **markdown**: Markdown is a lightweight markup language with plain-text formatting syntax used for authoring content, especially documentation and web applications.
- **modelAliases**: Allows aliases for model names in GenAIScript configuration.
- **modelEncodings**: Defines model-specific encodings for LLMs.
- **No Installation (npx)**: Run the GenAIScript CLI with npx without prior install
- **Node.JS run API**: API to run GenAIScript in isolated Node worker threads, preventing global scope pollution.
- **Playground**: Self-hosted web app for running GenAIScript scripts through a user-friendly UI, bridging CLI and VS Code integrations.
- **Prerequisites**: Requirements for using GenAIScript CLI, such as Node.JS installation.
- **Remote repository**: Playground can run scripts from a remote repository using current `.env` secrets.
- **run**: The `run` function wraps the [CLI run](/genaiscript/reference/cli/run) command to execute scripts.
- **Run a script**: Executes a script, streaming LLM output to stdout from the workspace root.
- **Running scripts from a remote repository**: Use `--remote` to load and run scripts from a remote repository via shallow clone.
- **samples**: Sample scripts are fully fledged and ready to use, but can be tweaked or modified to suit your needs.
- **script files**: GenAIScript identifies any `*.genai.mjs`, `*.genai.js`, or `*.genai.mts` in your workspace as scripts, which can be placed anywhere.
- **Starlight**: Starlight is a project for building and authoring documentation websites using Astro and specific design principles.
- **System behavior**: Framework for integrating code execution and foundation model/LLM invocations, letting users specify LLM context, invoke models, and parse results
- **system prompt templates**: Files `system.*.genai.mjs` are [system prompt templates](/genaiscript/reference/scripts/system), hidden by default.
- **system.*.genai.mjs**: `system.*.genai.mjs` are [system prompt templates](/genaiscript/reference/scripts/system), unlisted by default.
- **Transparency Note**: Information to help users understand GenAIScript’s capabilities and limitations.
- **Using the CLI as a Node.JS API**: Import and use GenAIScript CLI as an API in Node.JS.
- **Vector Search**: [Vector Search](/genaiscript/reference/scripts/vector-search/)
- **vision_script**: Script files (`*.genai.mjs` or `*.genai.mts`) using LLM prompting for prompt construction.
- **Visual Studio Code extension**: Add-in for VS Code to author, debug, and deploy GenAIScript scripts.
- **Visual Studio Code Markdown Preview**: Uses VS Code’s built-in Markdown preview for LLM output and trace, restricting some content display.
- **Visual Studio Code Marketplace**: The [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=genaiscript.genaiscript-vscode) provides the latest stable release of the [VS Code GenAIScript extension](https://marketplace.visualstudio.com/items?itemName=genaiscript.genaiscript-vscode).
- **Visual Studio Code Workspace Trust**: Disables the extension in [Restricted Mode](https://code.visualstudio.com/docs/editor/workspace-trust).
- **VS Code GenAIScript extension**: VS Code extension for creating, editing, running, and debugging GenAIScript scripts.
- **WarningCode**: Component to show security warnings and mitigations in documentation.
- **Working behind a Proxy**: Instructions for using CLI in environments with an HTTP proxy.
