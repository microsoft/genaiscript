
It is possible to define tests for the LLM scripts, to evaluate the output quality of the LLM
over time and model types.

The tests are executed by [promptfoo](https://promptfoo.dev/), a tool
for evaluating LLM output quality.

## Defining tests

The tests are declared in the `script` function in your test.
You may define one or many tests (array).

```js title="proofreader.genai.js" wrap "tests"
scripts({
  ...,
  tests: [{
    files: "src/rag/testcode.ts",
    rubrics: "is a report with a list of issues",
    facts: `The report says that the input string
      should be validated before use.`,
  }]
})
```

### `files`

`files` takes a list of file path (relative to the workspace) and populate the `env.files`
variable while running the test. You can provide multiple files by passing an array of strings.

```js title="proofreader.genai.js" wrap "files"
scripts({
  tests: {
    files: "src/rag/testcode.ts",
    ...
  }
})
```

### `rubrics`

`rubrics` checks if the LLM output matches given requirements,
using a language model to grade the output based on the rubric (see [llm-rubric](https://promptfoo.dev/docs/configuration/expected-outputs/model-graded/#examples-output-based)).
You can specify multiple rubrics by passing an array of strings.

```js title="proofreader.genai.js" wrap "rubrics"
scripts({
  tests: {
    rubrics: "is a report with a list of issues",
    ...,
  }
})
```

:::note[GPT-4 required]

The `rubrics` tests require to have
a OpenAI or Azure OpenAI configuration with a `gpt-4` model in the `.env` file.

:::

### `facts`

`facts` checks a factual consistency (see [factuality](https://promptfoo.dev/docs/guides/factuality-eval/)).
You can specify multiple facts by passing an array of strings.

> given a completion A and reference answer B evaluates
> whether A is a subset of B, A is a superset of B, A and B are equivalent,
> A and B disagree, or A and B differ,
> but difference don't matter from the perspective of factuality.

```js title="proofreader.genai.js" wrap "facts"
scripts({
  tests: {
    facts: `The report says that the input string should be validated before use.`,
    ...,
  }
})
```

:::note[GPT-4 required]

The `facts` tests require to have
a OpenAI or Azure OpenAI configuration with a `gpt-4` model in the `.env` file.

:::

### `asserts`

Other assertions on
[promptfoo assertions and metrics](https://promptfoo.dev/docs/configuration/expected-outputs/).

-   `icontains` (`not-icontains"`) output contains substring case insensitive
-   `equals` (`not-equals`) output equals string
-   `starts-with` (`not-starts-with`) output starts with string

```js title="proofreader.genai.js" wrap "asserts"
scripts({
    tests: {
        facts: `The report says that the input string should be validated before use.`,
        asserts: [
            {
                type: "icontains",
                value: "issue",
            },
        ],
    },
})
```

-   `contains-all` (`not-contains-all`) output contains all substrings
-   `contains-any` (`not-contains-any`) output contains any substring
-   `icontains-all` (`not-icontains-all`) output contains all substring case insensitive

```js title="proofreader.genai.js" wrap "asserts"
scripts({
    tests: {
        ...,
        asserts: [
            {
                type: "icontains-all",
                value: ["issue", "fix"],
            },
        ],
    },
})
```

#### transform

By default, the `asserts` are executed on the raw LLM output.
However, you can use a javascript expression to select a part of the output to test.

```js title="proofreader.genai.js" wrap "transform"
scripts({
    tests: {
        files: "src/will-trigger.cancel.txt",
        asserts: {
            type: "equals",
            value: "cancelled",
            transform: "output.status",
        },
    },
})
```

## Running tests

You can run tests from Visual Studio Code or using the [command line](/genaiscript/reference/cli).
In both cases, genaiscript generates a [promptfoo configuration file](https://promptfoo.dev/docs/configuration/guide)
and execute promptfoo on it.

### Visual Studio Code

-   Open the script to test
-   Right click in the editor and select **Run GenAIScript Tests** in the context menu
-   The [promptfoo web view](https://promptfoo.dev/docs/usage/web-ui/) will automatically
    open and refresh with the test results.

### Command line

Run the `test` command with the script file as argument.

```sh "test"
npx genaiscript test <scriptid>
```

You can specify additional models to test against by passing the `--models` option.

```sh '--models "ollama:phi3"'
npx genaiscript test <scriptid> --models "ollama:phi3"
```
