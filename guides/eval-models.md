GenAIScript allows you to [evaluate](/genaiscript/reference/scripts/tests) multiple models in a single script
against multiple tests.
This is useful when you want to compare the performance of different models on the same input.

GenAIScript leverages [PromptFoo](https://www.promptfoo.dev/docs/getting-started/) to evaluate the outputs of the models.

In this example, we will evaluate the performance of three models on a summarizing script.

```js title="summarizer.genai.js"
const file = def("FILE", env.files)
$`Summarize ${file} in one sentence.`
```

## Defining tests

First, you need to add one or more tests as the `tests` field in the `script` function.

```js
script({
    tests: { files: "markdown.md", keywords: "markdown" },
})
...
```

In this case, we add a simple `keyword` assertion but you can find many other options in the [tests](/genaiscript/reference/scripts/tests) reference.

## Defining test models

Next add the list of model identifier or [model aliases](/genaiscript/reference/scripts/model-aliases) you want to test against.

```js
script({
    ...,
    testModels: [
        "azure_ai_inference:gpt-4o",
        "azure_ai_inference:gpt-4o-mini",
        "azure_ai_inference:deepseek-r1",
    ],
})
...
```

## Running tests

Tests can be run using the `genaiscript` CLI or in Visual Studio Code (see [testing scripts](/genaiscript/getting-started/testing-scripts)).

```sh
genaiscript test summarizer
```

Next, open the PromptFoo dashboard to see the results of the tests.

```sh
genaiscript test view
```