
import { Image } from "astro:assets"
import testExplorerSrc from "../../../assets/vscode-test-explorer.png"
import testExplorerAlt from "../../../assets/vscode-test-explorer.png.txt?raw"

It is possible to declare [tests](/genaiscript/reference/scripts/tests) in the `script` function
to validate the output of the script.

## Declaring tests

The tests are added as an array of objects in the `tests` key of the `script` function.

```js title="proofreader.genai.mjs" wrap
scripts({
  ...,
  tests: {
    files: "src/rag/testcode.ts",
    rubrics: "is a report with a list of issues",
    facts: `The report says that the input string
      should be validated before use.`,
  }
})
```

## Running tests

### Visual Studio Code

-   Open the [Test Explorer view](https://code.visualstudio.com/docs/python/testing).
-   Select your script in the tree and click the `play` icon button.

<Image src={testExplorerSrc} alt={testExplorerAlt} loading="lazy" />

### Command Line

Run this command from the workspace root.

```sh
npx genaiscript test proofreader
```

## Known limitations

Currently, promptfoo treats the script source as the prompt text. Therefore, one cannot use assertions
that also rely on the input text, such as `answer_relevance`.

-   Read more about [tests](/genaiscript/reference/scripts/tests) in the reference.

## Next steps

[Automate](/genaiscript/getting-started/automating-scripts) script execution using the command line interface ([CLI](/genaiscript/reference/cli)).
