
import { Code } from "@astrojs/starlight/components"
import src from "../../../../../packages/sample/genaisrc/guard.genai.mjs?raw"


[Llama-guard3](https://ollama.com/library/llama-guard3) is a LLM model that specializes in detecting harmful content in text.
The script we're discussing aims at batch applying llama-guard to your files.

By automating this process, you can save time and focus on addressing only the files that need attention. 

<Code code={src} wrap={true} lang="js" title="guard.genai.mjs" />

## Line-by-Line Explanation of the Script 📜

Let's dive into the GenAI script and understand its components:

```js
// Iterate over each file provided by the environment
for (const file of env.files) {
```

Here, we loop through each file available in the `env.files` array, which contains the files you want to check.

```js
// Use a GenAI model to analyze each file for safety
const { text } = await prompt`${file}`.options({
    model: "ollama:llama-guard3:8b",
    label: file.filename,
    cache: "llama-guard3:8b",
    system: [],
})
```

This block uses the GenAI model [ollama:llama-guard3:8b](https://ollama.com/library/llama-guard3) to analyze the contents of each file. The `prompt` function sends the file to the model, and various options are set to specify the model, label the file, and manage cache.

```js
// Determine if the file is considered safe
const safe = /safe/.test(text) && !/unsafe/.test(text)
```

The script checks if the model's analysis considers the file safe by searching the response text for the word "safe" and ensuring "unsafe" isn't present.

```js
// Log and store filenames of unsafe files
if (!safe) {
    console.error(text)
}
```

If a file is found to be unsafe, its details are logged to the console.

## Running the Script with GenAIScript CLI 🚀

To run this script, you'll need to use the GenAIScript CLI. If you haven't installed it yet, follow the [installation guide](https://microsoft.github.io/genaiscript/getting-started/installation).

Once installed, execute the script using the following command:

```shell
genaiscript run guard **/*.ts
```

This command will check all the files matching "\*_/_.ts" and let you know which ones are unsafe.

Happy coding and stay safe! 🛡️
