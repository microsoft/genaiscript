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
- Use `pnpm -r test` to run all tests
- Use `pnpm test:core` for fast unit tests. It uses `vitest` to run tests.

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
