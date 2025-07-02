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
- Use `pnpm test:core` for fast unit tests
