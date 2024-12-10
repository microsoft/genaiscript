import WarningCode from "../../../components/WarningCode.astro"

We discuss various security risks and possible mitigations when using GenAIScript.
GenAISCript inherits the same security risks as running scripts, and adds some new threats due to the nature of the LLM-generated outputs.

We also recommend reading the [Transparency Note](/genaiscript/reference/transparency-note) 
to understand the capabilities and limitations of GenAIScript.

## Don't trust the scripts

Since the GenAIScript files `.genai.mjs` are executable JavaScript files and are in fact using a JavaScript runtime (VSCode or Node). It is important to understand that the script can do anything that JavaScript can do. This includes reading and writing files, making network requests, and executing JavaScript arbitrary code.

:::caution

Do not run `.genai.mjs` scripts from untrusted sources.

:::

## Don't trust the LLM Outputs

A trusted script might use malicious files from the context to generate a malicious output.
For example, overriding files in the project with new malicious code.

<WarningCode />

- in Visual Studio Code, use the refactoring preview
- in your CI/CD, create a pull request with the changes and review them


## Visual Studio Code Workspace Trust

The extension is **disabled** when opening a folder in [Restricted Mode](https://code.visualstudio.com/docs/editor/workspace-trust) in Visual Studio Code.

## Visual Studio Code Markdown Preview

The output of the LLM and the trace use the built-in markdown preview of Visual Studio Code.
By default, [VS Code restricts the content displayed in the Markdown preview](https://code.visualstudio.com/Docs/languages/markdown#_markdown-preview-security). 
This includes disabling script execution and only allowing resources to be loaded over `https`.
