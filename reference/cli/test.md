Runs the tests in scripts using [promptfoo](https://www.promptfoo.dev/).

```bash
genaiscript test "<scripts...>"
```

You can override which models to use in the tests using `--models`:

```bash "--models openai:gpt-4 ollama:phi3"
genaiscript test "<scripts...>" --models openai:gpt-4 ollama:phi3
```

:::note

This feature requires to add `@genaiscript/api` to your `package.json` dependencies.

:::

## result viewer

Run the `test view` command to launch the test result viewer:

```bash
npx genaiscript test view
```