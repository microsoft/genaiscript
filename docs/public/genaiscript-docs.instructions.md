GenAIScript is a JavaScript framework for building, orchestrating, and automating LLM prompts and workflows. It supports multiple LLMs like OpenAI, Anthropic, Azure AI, and GitHub Copilot. Key features include file/data ingestion, speech-to-text transcription, image/video processing, code execution, web search, browser automation, content safety validation, and schema validation. Scripts are shareable, version-controlled, and integrate into CI/CD pipelines.

### Core Concepts:
1. **Prompt Creation**: `$` generates prompts, and `def` includes files/data. Outputs can be parsed and saved.
2. **Tools and Agents**: Define tools for specific tasks (e.g., weather queries) and agents for complex workflows.
3. **File/Data Processing**: Supports formats like PDF, DOCX, CSV, XLSX, and integrates with tools like ffmpeg for video/audio processing.
4. **Code Execution**: Runs code in Docker containers or sandboxes.
5. **Web Integration**: Enables web search, browser automation, and vector search for retrieval-augmented generation.
6. **Content Safety**: Validates outputs for harmful content and prevents prompt injection.
7. **Model Support**: Works with local/cloud-based models, including Azure AI, Google, and open-source models.

### Examples:
- **Summarizing Files**:
```js
for (const file of env.files) {
  const { text } = await runPrompt((_) => {
    _.def("FILE", file);
    _.$`Summarize the FILE.`;
  });
  def("SUMMARY", text);
}
$`Summarize all the summaries.`;
```
- **Image Generation**:
```js
const { image } = await generateImage("a cute cat, high details.");
```

### Advanced Use Cases:
1. **Pull Request Reviewer**:
   Analyzes PR changes and posts comments on GitHub.
   ```ts
   script({
       title: "Pull Request Reviewer",
       description: "Review the current pull request",
       systemSafety: true,
       parameters: { base: "" },
   });
   const changes = await git.diff({ base, llmify: true });
   $`Report errors in ${changes} using the annotation format.`;
   ```
2. **Spell Checker**:
   Automates spell-checking and grammar fixes for `.md` files.
   ```js
   const files = await git.listFiles("*.md");
   for (const file of files) {
       const { text } = await runPrompt((_) => {
           _.def("FILE", file);
           _.$`Fix spelling and grammar in FILE.`;
       });
       await workspace.writeText(file, text);
   }
   ```
3. **Image Alt Text**:
   Generates alt text for images in Markdown files.
   ```js
   const images = await workspace.grep(/!\[.*\]\((.*)\)/, "*.md");
   for (const image of images) {
       const { text } = await runPrompt((_) => {
           _.defImages(image);
           _.$`Generate alt text for the image.`;
       });
       await workspace.writeText(image.file, text);
   }
   ```

### CLI Commands:
- **Run Scripts**: `genaiscript run <script> <files>` executes scripts on specified files.
- **Test Scripts**: `genaiscript test <script>` evaluates script output quality.
- **Serve**: `genaiscript serve` launches a local web server for script execution.
- **Convert**: `genaiscript convert <script> <files>` processes files individually.
- **Cache Management**: `genaiscript cache clear` clears cached data.

### Configuration:
- **Environment Variables**: `.env` files store secrets and configurations.
- **Model Aliases**: Define shorthand names for models (e.g., `large`, `small`).
- **Content Safety**: Integrates with Azure AI Content Safety for harmful content detection.

### Tools and Agents:
- **Tool Definition**:
```js
defTool("sum", "Sum two numbers", { a: 1, b: 2 }, ({ a, b }) => `${a + b}`);
```
- **Agent Definition**:
```js
defAgent("git", "Handles git operations", "You are a git expert.", { tools: ["git"] });
```

### File Handling:
- **File Processing**:
```js
def("FILES", env.files, { endsWith: ".md" });
$`Summarize FILES.`;
```
- **Custom File Merge**:
```js
defFileMerge((filename, label, before, generated) => {
    if (!/\.txt$/i.test(filename)) return undefined;
    return before ? `${before}\n${generated}` : generated;
});
```

### Debugging and Testing:
- **Debugging**: Use VS Code debugger or lightweight logging with `DEBUG=script`.
- **Testing**: Define tests in `script` metadata and run via CLI or VS Code.

### Integrations:
- **GitHub Actions**: Automate workflows with `genaiscript` in CI/CD pipelines.
- **Azure AI**: Integrates with Azure AI Foundry for model inference and content safety.
- **Playwright**: Enables browser automation for web scraping and testing.

### Plugins:
- **Markdown AST**: Parse and manipulate Markdown files.
- **MermaidJS**: Generate and repair diagrams.
- **Z3 Solver**: Solve logical formulas for program verification.

### Use Cases:
1. **Documentation Translation**: Translate Markdown files while preserving syntax.
2. **Release Notes**: Generate release notes from Git commit history.
3. **SEO Optimization**: Update front matter fields for better SEO.

### Best Practices:
- **Prompt Design**: Craft effective prompts tailored to specific LLMs.
- **Context Management**: Use `def` to structure input data efficiently.
- **Security**: Validate outputs for harmful content and prevent prompt injection.

### Limitations:
- **IDE Support**: Primarily supports VS Code.
- **Model Integrations**: Limited to supported LLMs.

GenAIScript simplifies LLM scripting with reusable components, fast development cycles, and robust integrations, making it a powerful tool for automating complex workflows.