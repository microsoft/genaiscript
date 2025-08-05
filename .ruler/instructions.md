# GenAIScript

- Always use the `dev` branch for development or upstream.
- Use `vitest` to generate tests. Place tests in the `tests` directory.

```files
  src/code.ts
  test/code.test.ts
```

- Generate TypeScript (esm, async/await) code when possible, not JavaScript.
- Filenames should be lowercase, with no spaces or special characters.

## Building and testing

- Use `pnpm build` to build the project
- Use `pnpm build:cli` to build the cli only
- Use `pnpm -r test` to run all tests
- Use `pnpm test:core` for fast unit tests. It uses `vitest` to run tests.
- Use `pnpm build:docs` to build the documentation

NEVER try to run `genaiscript` using `npx`. Always using
the local cli

```sh
node packages/cli/dist/src/index.js run
```

## Debug logging

If you need to add debug logging, use `genaiscriptDebug("category")` to instantiate a new debug logger in a file
where `category` is a descriptive name for the module or feature.

```ts
import { genaiscriptDebug } from "@genaiscript";
const debug = genaiscriptDebug("category");
```

To enable debug logging, add `DEBUG=genaiscript:category` to the environment variables when running the script.

```bash
DEBUG=genaiscript:category pnpm test:core
```

## Interaction Guidelines

Before returning control to the user, always suggest potential improvements, optimizations, or additional considerations related to the task, code, or solution being discussed. This helps ensure comprehensive and thoughtful assistance.

## Agent Efficiency Guidelines

### Repository Navigation & Understanding
- Use multiple tools simultaneously when exploring (e.g., view directories and key files in parallel)
- Always examine package.json, README.md, and build scripts first to understand project structure
- Check existing tests and documentation patterns before creating new ones

### Incremental Development Approach
- Make small, focused changes and validate immediately
- Run lints/builds/tests after each logical change, not just at the end
- Use `git status` and `git diff` frequently to track changes
- Prefer modifying existing files over creating new ones when possible

### Tool Usage Optimization
- Use `async=false` with appropriate timeouts for long-running commands (build, test, install)
- Chain related commands when possible: `pnpm build && pnpm test`
- Always disable pagers: use `git --no-pager` for git commands
- Use `pnpm test:core` for fast feedback, `pnpm -r test` for comprehensive testing

### Error Recovery & Validation
- If builds fail, focus only on errors related to your changes
- Use `git checkout <file>` to revert problematic changes quickly
- Validate each change doesn't break existing functionality
- Check for unintended side effects in related files

### Time Management
- Set appropriate timeouts for long operations (200s for builds, 300s for installs)
- Use incremental approaches rather than large refactors
- Focus on the minimal viable change to address the issue
