# GenAIScript Copilot Instructions

This document provides AI coding agents with essential knowledge for immediate productivity when working with the GenAIScript codebase.

## Architecture Overview

GenAIScript is a TypeScript-based monorepo that enables programmatic assembly of prompts for Large Language Models (LLMs). The repository is organized as follows:

**Core Packages:**
- `packages/core/` - Core runtime and execution engine
- `packages/cli/` - Command-line interface and tools
- `packages/vscode/` - Visual Studio Code extension
- `packages/web/` - Web-based interface
- `packages/api/` - API definitions and types
- `packages/runtime/` - Runtime environment and execution

**Development Areas:**
- `genaisrc/` - Main GenAI scripts for project automation
- `samples/` - Example projects demonstrating usage patterns
- `docs/` - Documentation site built with Astro
- `examples/` - Additional examples and demonstrations

## Development Patterns

### GenAI Script Pattern

GenAI scripts follow a consistent structure using TypeScript/JavaScript:

```typescript
script({
    model: "large",
    system: ["system", "system.files"],
    tools: ["fs", "md"]
})

def("FILES", env.files)
$`Analyze FILES and extract insights`
```

**Key Conventions:**
- Scripts use `.genai.mts` extension for TypeScript modules
- Scripts use `.genai.mjs` extension for JavaScript modules
- Place scripts in `genaisrc/` directory
- Use `script()` function to configure execution parameters
- Use `def()` to define reusable variables
- Use template literals with `$\`\`` for prompts

### TypeScript Usage

- All core packages use TypeScript 5.8.3
- Configuration via `tsconfig.json` files with shared base configs
- ESM modules throughout the codebase
- Strict type checking enabled
- Use catalog references for consistent dependency versions

## Build System

The project uses pnpm workspaces with Turbo for orchestration.

### Essential Commands

**Build Commands:**
```bash
pnpm run build:cli          # Build CLI without docs/vscode
pnpm run build              # Full build with Turbo
pnpm run build:ci           # CI build excluding docs
```

**Testing Commands:**
```bash
pnpm run test:core          # Core package tests
pnpm run test:samples       # Sample project tests
pnpm run test:scripts       # Script validation tests
```

**Development Commands:**
```bash
pnpm run genai <script>     # Run GenAI scripts
pnpm run serve              # Start development servers
pnpm run lint:fix           # Fix linting issues
```

### Workspace Structure

The `pnpm-workspace.yaml` defines:
- `packages/*` - Core packages
- `docs` - Documentation site
- `samples/*` - Example projects
- `tools/*` - Build and development tools

## Integration Points

### LLM Providers

GenAIScript supports multiple LLM providers:
- OpenAI (GPT models)
- Azure OpenAI
- GitHub Models
- Ollama (local models)
- Anthropic Claude
- Google Gemini

### External Services

- **Azure AI Services** - Content safety, document intelligence
- **GitHub Integration** - Issues, PRs, code scanning
- **Container Support** - Docker, Pyodide for Python
- **File Format Support** - PDF, DOCX, CSV, XLSX, images

### Tools and Agents

Common tools available in scripts:
- `fs` - File system operations
- `md` - Markdown processing
- `git` - Git operations
- `github` - GitHub API access
- `agent_*` - Specialized agents (fs, docs, web, etc.)

## Essential References

### Key Configuration Files

- `package.json` - Root package with 100+ npm scripts
- `turbo.json` - Build orchestration configuration
- `pnpm-workspace.yaml` - Workspace definitions
- `genaiscript.config.json` - GenAI script configuration

### Important Directories

- `genaisrc/linters/` - Linting and validation scripts
- `samples/sample/genaisrc/` - Comprehensive script examples
- `packages/core/src/` - Core runtime implementation
- `.github/instructions/` - Additional AI development guides

### Script Examples

- `genaisrc/linters.genai.mts` - Code linting and review
- `samples/sample/genaisrc/summarize.genai.mjs` - File summarization
- `samples/sample/genaisrc/code-review.genai.js` - Code review automation
- `samples/sample/genaisrc/pr-review.genai.mjs` - Pull request analysis

### Development Workflow

1. **Setup**: `pnpm install` to install dependencies
2. **Build**: `pnpm run build:cli` for core functionality
3. **Test**: `pnpm run test:core` to validate changes
4. **Scripts**: `pnpm run genai <script-name>` to run GenAI scripts
5. **Lint**: `pnpm run lint:fix` to maintain code quality

The codebase emphasizes TypeScript, ESM modules, and modern JavaScript patterns throughout. All development follows the established patterns in the samples directory.