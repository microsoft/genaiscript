
Runs the tests in scripts using [promptfoo](https://www.promptfoo.dev/).

```bash
npx genaiscript test "<scripts...>"
```

You can override which models to use in the tests using `--models`:

```bash "--models openai:gpt-4 ollama:phi3"
npx genaiscript test "<scripts...>" --models openai:gpt-4 ollama:phi3
```

## result viewer

Run the `test view` command to launch the test result viewer:

```bash
npx genaiscript test view
```
