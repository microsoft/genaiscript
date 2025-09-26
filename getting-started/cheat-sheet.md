import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Code } from "@astrojs/starlight/components";

# GenAIScript Cheat Sheet

Quick reference guide for GenAIScript syntax, core functions, and common patterns.

## Quick Reference

| Function      | Purpose                   | Example                                                  |
| ------------- | ------------------------- | -------------------------------------------------------- |
| `script()`    | Configure script metadata | `script({ title: "My Script", model: "openai:gpt-4o" })` |
| `def()`       | Include content in prompt | `def("FILES", env.files)`                                |
| `$``...`` `   | Create prompt template    | `$`Analyze the FILES` `                                  |
| `defTool()`   | Define custom tool        | `defTool("weather", "Get weather", {}, () => "sunny")`   |
| `defSchema()` | Define data schema        | `defSchema("DATA", { type: "object" })`                  |
| `runPrompt()` | Execute inline prompt     | `await runPrompt((_) => _.$`Hello`)`                     |

## Basic Script Structure

### Minimal Script

```js
$`Write a poem about code.`;
```

### Complete Script

```js
script({
  title: "My Script",
  description: "Does something useful",
  model: "openai:gpt-4o",
  temperature: 0.1,
});

def("FILES", env.files);
$`Analyze FILES and provide insights.`;
```

### Markdown Script Alternative

```markdown title="script.genai.md"
---
title: "My Script"
description: "Does something useful"
model: "openai:gpt-4o"
---

# Task

Analyze the provided files and provide insights.
```

## Core Functions

### script() - Script Configuration

```js
script({
  // Metadata
  title: "Script Name",
  description: "What it does",
  group: "category",

  // Model settings
  model: "openai:gpt-4o",
  temperature: 0.1,
  maxTokens: 4000,

  // File handling
  files: "**/*.md",
  accept: ".md,.txt,.js",
  ignore: "**/node_modules/**",

  // Tools & capabilities
  tools: ["fs_read_file", "web_search"],
  vision: true,
  cache: true,

  // Testing
  tests: [
    {
      files: "test.md",
      keywords: ["expected", "output"],
    },
  ],
});
```

### def() - Include Content

```js
// Basic usage
def("VAR_NAME", content);

// With options
def("FILES", env.files, {
  lineNumbers: true, // Add line numbers
  maxTokens: 1000, // Limit token count
  language: "markdown", // Specify language
  glob: "**/*.md", // Filter files by pattern
  endsWith: ".js", // Filter by extension
  sliceHead: 100, // Take first N lines
  sliceTail: 50, // Take last N lines
});

// From file
def("CONFIG", await workspace.readText("config.json"));

// Multiple files
def(
  "DOCS",
  env.files.filter((f) => f.endsWith(".md")),
);
```

### $\`\` - Template Prompts

```js
// Simple prompt
$`Write a summary of the content.`;

// Multi-line prompt
$`
You are an expert reviewer.
Analyze the FILES and:
1. Check for errors
2. Suggest improvements
3. Rate quality 1-10
`;

// With variables
const task = "summarize";
$`Please ${task} the provided content.`;
```

## `env`

### env.files

```js
// Current selection/context files
def("FILES", env.files);

// Filter files
const mdFiles = env.files.filter((f) => f.endsWith(".md"));
const jsFiles = env.files.filter((f) =>
  f.filename.endsWith(".js"),
);
```

### Parameters

```js
script({
  parameters: {
    topic: {
      type: "string",
      description: "Topic to write about",
    },
    count: { type: "number", default: 5 },
  },
});

$`Write ${env.parameters.count} facts about ${env.parameters.topic}.`;
```

## Inline Prompts

```js
const summary = await runPrompt((_) => {
  _.def("FILE", file);
  _.$`Summarize FILE in one sentence.`;
});
def("SUMMARY", summary.text);
```

## File Operations

### Reading Files

```js
// Read text file
const content = await workspace.readText("path/to/file.txt");

// Read JSON
const data = await workspace.readJSON("data.json");

// Search files
const { files } = await workspace.grep(/pattern/, {
  globs: "**/*.js",
});

// Find files
const matches = await workspace.findFiles("**/*.md", {
  maxFiles: 100,
});
```

## Data Handling

### Schemas & Validation

```js
const schema = defSchema("DATA", {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    skills: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["name"],
});

$`Extract data using ${schema} format.`;
```

### File Parsers

```js
// CSV - structured data
const rows = await parsers.CSV(file);
defData("TABLE", rows, { sliceHead: 10 });

// PDF - documents
const { pages } = await parsers.PDF(file);
def("CONTENT", pages.map((p) => p.content).join("\n"));

// DOCX - Word documents
const { content } = await parsers.DOCX(file);

// XLSX - spreadsheets
const { worksheets } = await parsers.XLSX(file);
const sheet1 = worksheets[0];

// JSON - structured config
const config = await parsers.JSON(file);

// YAML - configuration files
const settings = await parsers.YAML(file);

// XML - markup data
const { content } = await parsers.XML(file);
```

### Data Transformation

```js
// Filter and process data
const markdownFiles = env.files.filter((f) =>
  f.endsWith(".md"),
);
const recentFiles = env.files.filter(
  (f) => new Date(f.lastModified) > new Date("2024-01-01"),
);

// Transform data for context
defData("SUMMARY", {
  totalFiles: env.files.length,
  fileTypes: [...new Set(env.files.map((f) => f.extension))],
  totalSize: env.files.reduce((sum, f) => sum + f.size, 0),
});
```

## Tools & Agents

### Built-in Tools

```js
script({
  tools: [
    "fs_read_file", // File system read
    "fs_find_files", // File search
    "web_search", // Web search
    "math_eval", // Math evaluation
    "python_code_interpreter", // Code execution
  ],
});
```

### Custom Tools

```js
defTool(
  "weather",
  "Get current weather",
  {
    city: { type: "string", description: "City name" },
  },
  async ({ city }) => {
    // Tool implementation
    return `Weather in ${city}: Sunny, 25°C`;
  },
);
```

### Agents

```js
script({ tools: "agent_fs" }); // File system agent
script({ tools: "agent_git" }); // Git operations agent
script({ tools: "agent_playwright" }); // Web automation agent

// Custom agent
defAgent("myagent", "Description", "You are helpful", {
  tools: ["fs_read_file", "web_search"],
});
```

## Images & Media

### Images

```js
// Include images in prompt
defImages(
  env.files.filter((f) => f.endsWith(".png")),
  {
    autoCrop: true,
    details: "low", // or "high"
  },
);

// Generate images
const { image } = await generateImage("a cute cat");
```

### Videos

```js
// Extract frames
const frames = await ffmpeg.extractFrames(videoFile, {
  count: 5,
});
defImages(frames);

// Transcription
const transcript = await transcript(audioFile);
def("TRANSCRIPT", transcript.text);
```

## CLI Commands

### Running Scripts

```bash
# Run script on files
npx genaiscript run scriptname "**/*.md"

# With specific model
npx genaiscript run scriptname --model openai:gpt-4o

# Apply edits directly
npx genaiscript run scriptname --apply-edits

# Pull request mode
npx genaiscript run scriptname --pull-request-reviews

# Dry run (no changes)
npx genaiscript run scriptname --dry-run

# With temperature setting
npx genaiscript run scriptname --temperature 0.1

# Maximum tokens
npx genaiscript run scriptname --max-tokens 2000
```