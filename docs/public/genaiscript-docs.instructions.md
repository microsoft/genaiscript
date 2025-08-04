GenAIScript is a JavaScript framework for creating, orchestrating, and automating LLM prompts and workflows. It supports multiple LLMs like OpenAI, Anthropic, Azure AI, and GitHub Copilot. Key features include file/data ingestion, speech-to-text transcription, image/video processing, code execution, web search, browser automation, vector search, content safety validation, and secret scanning. Scripts are shareable, version-controlled, and integrate into CI/CD pipelines.

### Core Concepts:
1. **Prompt Creation**: Use `$` for dynamic prompts and `def` for context variables. Example:
   ```js
   $`Write a one-sentence poem.`;
   def("FILE", env.files);
   $`Summarize FILE in one sentence.`;
   ```
2. **Tools and Agents**: Define tools for specific tasks and group them into agents for complex workflows. Example:
   ```js
   defTool("sum", "Sum two numbers", { a: 1, b: 2 }, ({ a, b }) => `${a + b}`);
   defAgent("math", "Performs arithmetic", "You are a math expert.", { tools: ["sum"] });
   ```
3. **File Processing**: Automate tasks like summarization, translation, and code annotation. Example:
   ```js
   def("FILES", env.files, { endsWith: ".md" });
   $`Summarize FILES.`;
   ```

### Advanced Features:
- **Structured Outputs**: Define schemas for JSON/YAML outputs, ensuring data validity.
- **Vector Search**: Index and search documents for retrieval-augmented generation (RAG).
- **Image/Video Processing**: Extract frames, transcribe audio, and generate alt text.
- **Browser Automation**: Use Playwright for web interaction and data scraping.
- **GitHub Integration**: Analyze pull requests, issues, and workflows.

### CLI Commands:
- `run`: Execute scripts on files. Example: `genaiscript run summarize "docs/*.md"`.
- `convert`: Process files individually. Example: `genaiscript convert summarize "docs/*.md"`.
- `serve`: Launch a local web server for script execution.
- `test`: Run tests on scripts using PromptFoo.

### Configuration:
- **Models**: Specify LLMs via `script({ model: "openai:gpt-4o" })`. Use aliases like `large` or `small`.
- **Environment Variables**: Store secrets in `.env` files. Example: `OPENAI_API_KEY=...`.
- **Caching**: Enable prompt caching for efficiency. Example: `script({ cache: true })`.

### Security:
- **Content Safety**: Detect harmful content and prompt injections using Azure AI Content Safety.
- **Secret Scanning**: Identify and redact sensitive information in prompts.

### Integration:
- **GitHub Actions**: Automate workflows with `genaiscript` in CI/CD pipelines.
- **MCP (Model Context Protocol)**: Expose scripts as tools for integration with AI-driven workflows.

### Examples:
1. **Pull Request Reviewer**:
   ```js
   script({ title: "PR Reviewer", description: "Review pull requests" });
   const changes = await git.diff({ base: "main" });
   $`Analyze changes: ${changes}`;
   ```
2. **Image Alt Text Generator**:
   ```js
   defImages(env.files);
   $`Generate alt text for images.`;
   ```
3. **Markdown Summarizer**:
   ```js
   def("FILES", env.files, { endsWith: ".md" });
   $`Summarize FILES.`;
   ```

### Plugins:
- **Markdown AST**: Parse and manipulate Markdown files.
- **AST Grep**: Perform structural code analysis.
- **Mermaid**: Generate and repair diagrams.
- **Z3 Solver**: Solve logical formulas.

### Use Cases:
- **Documentation Translation**: Preserve macros and syntax while translating Markdown.
- **Code Linting**: Automate code reviews and style checks.
- **Release Notes**: Generate concise, engaging release notes from Git history.

### Best Practices:
- Use schemas for structured outputs.
- Leverage caching for repeated prompts.
- Validate outputs with content safety tools.
- Modularize scripts for reusability.

### Installation:
Install via npm:
```sh
npm install -g genaiscript
```
Run scripts:
```sh
npx genaiscript run <script> <files>
```

### Debugging:
Use VS Code for script debugging. Add breakpoints and launch the debugger.

### Future Enhancements:
- Support for additional LLMs and tools.
- Improved integration with CI/CD pipelines.
- Enhanced security features for prompt validation.