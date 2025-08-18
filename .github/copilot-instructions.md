# GenAIScript Development Instructions

**ALWAYS follow these instructions first.** Only fallback to additional search and context gathering if the information in these instructions is incomplete or found to be in error.

## Working Effectively

### Prerequisites and Environment Setup
- **CRITICAL**: Requires Node.js >= 20.0.0. Check version with `node -v`
- Install Node.js LTS if needed: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- Uses Yarn workspace package manager - install globally: `npm install -g yarn`
- Install ffmpeg for media processing: `yarn ffmpeg:install` or `sudo apt-get update && sudo apt-get install ffmpeg -y`

### Recommended Setup (GitHub Codespaces)
- **RECOMMENDED**: Use GitHub Codespaces for consistent environment
- Go to https://github.com/microsoft/genaiscript
- Click **Code** → **Create new Codespace** → Select **dev** branch
- Codespaces provides pre-configured environment with all dependencies

### Bootstrap and Build the Repository
- **CRITICAL**: Set timeout to 60+ minutes for build commands. NEVER CANCEL builds.
- Bootstrap dependencies:
  ```bash
  yarn install --frozen-lockfile --prefer-offline
  ```
  **TIME ESTIMATE**: 3-5 minutes. If fails due to firewall/network limitations with cdn.sheetjs.com, try `yarn install` without flags.

- Full compilation for CI/production:
  ```bash
  yarn compile:action
  ```
  **TIME ESTIMATE**: 8-12 minutes. NEVER CANCEL. This runs typecheck + compile + packaging.

- Development compilation:
  ```bash
  yarn compile      # Full compile with esbuild - 5-8 minutes  
  ```

- Individual build commands:
  ```bash
  yarn typecheck    # TypeScript type checking - 3-5 minutes
  yarn compile:cli  # CLI compilation only - 2-3 minutes
  yarn compile:ext  # VSCode extension compilation - 3-4 minutes
  yarn lint         # Code linting - 1-2 minutes
  ```

### Testing (CRITICAL - NEVER CANCEL)
- **CRITICAL**: Test suites can take 15-30 minutes total. Set timeouts to 45+ minutes.
- Core tests:
  ```bash
  yarn test:core    # Core package tests - 5-10 minutes
  ```
- Sample and module tests:
  ```bash
  yarn test:samples        # Sample package tests - 5-10 minutes
  yarn test:modulesamples  # Module sample tests - 3-5 minutes
  ```
- System and compilation tests:
  ```bash
  yarn test:system   # Compile system scripts - 2-3 minutes
  yarn test:compile  # Test script compilation - 1-2 minutes
  yarn test:fix      # Update script definitions - 1-2 minutes
  ```

### Running the Application
- **ALWAYS** build the project first before running.
- CLI usage (after building):
  ```bash
  node packages/cli/built/genaiscript.cjs [command]
  # or use yarn shortcuts
  yarn genai [command]    # Run GenAI script
  yarn cli [command]      # Direct CLI access
  ```
- Development servers:
  ```bash
  yarn serve          # Starts CLI + web + webapi servers
  yarn serve:cli      # CLI server only
  yarn serve:web      # Web interface only  
  yarn serve:webapi   # Web API server only
  ```
- Documentation:
  ```bash
  yarn docs           # Start Astro dev server on localhost
  yarn build:docs     # Build documentation - 10-15 minutes NEVER CANCEL
  ```

## Validation Scenarios

**MANUAL VALIDATION REQUIREMENT**: After making changes, ALWAYS run these validation scenarios:

### Basic CLI Functionality Test
```bash
# Test help system
node packages/cli/built/genaiscript.cjs --help

# Test script listing  
node packages/cli/built/genaiscript.cjs scripts list

# Test script information
node packages/cli/built/genaiscript.cjs scripts info

# Test basic script compilation
node packages/cli/built/genaiscript.cjs scripts compile

# Test basic script execution (requires API keys)
node packages/cli/built/genaiscript.cjs run summarize README.md

# Test parsing functionality  
node packages/cli/built/genaiscript.cjs parse pdf [pdf-file]
node packages/cli/built/genaiscript.cjs parse docx [docx-file]
```

### Build and Package Validation
```bash
# Test VSCode extension packaging
yarn package

# Verify built artifacts exist
ls -la packages/cli/built/genaiscript.cjs
ls -la packages/vscode/genaiscript.vsix
ls -la packages/core/built/
```

### Development Workflow Test
```bash
# Test the fix command for updating definitions
yarn test:fix

# Test script information and model details
yarn test:infomodel

# Test retrieval and search functionality
yarn retrieval:index "packages/sample/src/rag/*"
yarn retrieval:search lorem "packages/sample/src/rag/*"

# Test token counting
yarn test:tokens packages/sample/src/rag/*
```

### Full End-to-End Validation
```bash
# Test sample script execution
cd packages/sample && yarn run:script

# Test debugging mode
yarn run:script:debug

# Test script testing framework
cd packages/sample && yarn test:scripts

# View test results
cd packages/sample && yarn test:scripts:view
```

## Critical Development Workflows

### Making Code Changes
1. **ALWAYS** run `yarn typecheck` before committing
2. **ALWAYS** run `yarn lint` before committing - CI will fail otherwise  
3. **ALWAYS** run `yarn test:core` after core package changes
4. **ALWAYS** run `yarn test:samples` after sample changes
5. **ALWAYS** run `yarn compile` after TypeScript changes
6. **NEVER** commit without testing your specific change scenario

### Working with Scripts and Prompts
- User scripts are in `genaisrc/` directory (root level)
- System scripts are in `packages/cli/genaisrc/`
- Sample scripts are in `packages/sample/genaisrc/`
- Test scripts with: `yarn test:scripts` (from packages/sample)
- Fix script definitions: `yarn test:fix --force`
- Generate documentation: `yarn genai:docs`

### Working with Documentation
- Documentation source: `docs/src/content/docs/`
- Build docs: `yarn build:docs` (takes 10-15 minutes, NEVER CANCEL)
- Generate technical docs: `yarn genai:technical`
- Generate blog posts: `yarn genai:blog-post`
- Update README: `yarn genai:readme`

### VSCode Extension Development
- **CRITICAL**: Uninstall official GenAIScript extension before debugging
- Open Debug view in VS Code
- Select "Samples" debugger configuration and click Run
- If debugger fails to launch, run `yarn compile` once then try again
- Debugger attaches to extension only, not GenAIScript server

### Container and Docker Support
- Start Ollama: `yarn ollama` (starts and stops Ollama container)
- Start LocalAI: `yarn localai`
- Start Whisper ASR: `yarn whisper`
- Debug MCP: `yarn debug:mcp`

## Common Locations and File Structure

### Key Directories
```
packages/
├── core/       # Core GenAIScript functionality
├── cli/        # Command line interface
├── vscode/     # Visual Studio Code extension
├── web/        # Web interface
└── sample/     # Sample scripts and tests

genaisrc/       # Root-level GenAI scripts
docs/           # Documentation (Astro site)
.github/        # GitHub Actions workflows
```

### Important Files
- `package.json` - Root workspace configuration
- `packages/cli/package.json` - CLI package (main executable)
- `packages/core/src/` - Core TypeScript source
- `packages/cli/src/` - CLI TypeScript source
- `.github/workflows/build.yml` - Main CI pipeline
- `yarn.lock` - Dependency lock file (DO NOT modify manually)

### Frequently Modified Files After Changes
- Always check `packages/core/src/scripts.ts` after API changes
- Always check `packages/cli/src/` after CLI changes
- Always regenerate docs with `yarn test:fix` after script changes

## Build Timing and Expectations

**CRITICAL TIMING INFORMATION**:
- Total fresh build: 15-25 minutes (NEVER CANCEL)
- Dependency installation: 3-5 minutes  
- Full compilation (`yarn compile:action`): 8-12 minutes
- Individual compilation (`yarn compile`): 5-8 minutes
- TypeScript checking (`yarn typecheck`): 3-5 minutes
- Complete test suite: 15-30 minutes
- Documentation build: 10-15 minutes
- VSCode packaging: 2-3 minutes

**NEVER CANCEL ANY BUILD OR TEST COMMAND** - Set timeouts to 60+ minutes minimum.

## Known Issues and Workarounds

### Dependency Installation Issues
- **xlsx package**: May fail to install from cdn.sheetjs.com due to firewall restrictions
- **Workaround**: Try `yarn install` without `--frozen-lockfile` flag
- **Alternative**: Use GitHub Codespaces environment for better network access
- **Docker environment**: Use provided Dockerfile or GitHub Codespaces

### Development Environment Issues
- **Recommended**: Use GitHub Codespaces for consistent environment
- **VSCode Extension Development**: Uninstall official extension before debugging local version
- **Debugger Issues**: Run `yarn compile` once if debugger launch fails
- **Build appears stuck**: Builds can take 15+ minutes, wait at least 60 minutes before considering timeout

### Network and Performance  
- Builds may appear to hang but are actually processing - wait at least 60 minutes
- Use `--network` flag for web API server if testing across networks
- Docker containers for local AI models: `yarn ollama` for Ollama setup
- Use `yarn cache:clear` if experiencing dependency issues

## Key Package Scripts Reference

```bash
# Main workflow commands  
yarn compile:action  # Full build + typecheck for CI - 8-12 minutes
yarn compile         # Full compilation - 5-8 minutes
yarn serve          # Development servers (cli + web + webapi)
yarn test:core      # Core functionality tests - 5-10 minutes
yarn test:samples   # Sample script tests - 5-10 minutes
yarn package        # Build VSCode extension - 2-3 minutes

# Development helpers
yarn test:fix       # Update script definitions - 1-2 minutes
yarn genai          # Run GenAI script - varies
yarn cli            # Direct CLI access
yarn pretty         # Format code with Prettier
yarn typecheck      # TypeScript checking only - 3-5 minutes
yarn lint           # Code linting - 1-2 minutes

# Testing and validation
yarn test:system    # Compile system scripts - 2-3 minutes
yarn test:compile   # Test script compilation - 1-2 minutes  
yarn test:modulesamples # Module sample tests - 3-5 minutes
yarn test:infomodel # Test script information - 1 minute

# Documentation and content
yarn docs           # Documentation dev server
yarn build:docs     # Build documentation - 10-15 minutes
yarn genai:technical # Generate technical docs
yarn genai:readme   # Update README
yarn genai:blog-post # Generate blog posts
yarn gen:licenses   # Update license file

# Container and external services
yarn ollama         # Start/stop Ollama container
yarn localai       # Start LocalAI container  
yarn whisper        # Start Whisper ASR container
yarn ffmpeg:install # Install ffmpeg dependency

# Advanced development
yarn upgrade:deps   # Update dependencies
yarn debug:mcp      # Debug Model Context Protocol
yarn clean          # Clean build artifacts and caches
```

**Remember**: This is a complex AI scripting framework. Always validate your changes work with real GenAI script scenarios, not just unit tests. Test with actual LLM providers when possible.