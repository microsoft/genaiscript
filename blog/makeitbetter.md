import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

GenAIScript comes with a helper that tells the LLM to "make it better".
It's a surprising way to improve your code by repeating a set of instructions multiple times.

## Code Explanation

Let's walk through the script line by line:

```js
import { makeItBetter } from "genaiscript/runtime"
```

This line imports the `makeItBetter` function from the GenAIScript runtime. This function is used to improve code by repeating a set of instructions multiple times.

```js
def("CODE", env.files)
```

This line defines a constant named "CODE" that represents the files in the environment. It essentially sets up the context for the code that needs improvement.

```js
$`Analyze and improve the code.`
```

This line is a prompt for the AI model. It instructs the system to analyze and enhance the code. The `$` is used to denote that this is a special instruction, not a regular code command.

```js
// tell the LLM to 'make it better' 2 times
```

This comment explains the upcoming line of code, making it clear that the `makeItBetter` function will be called twice.

```js
makeItBetter({ repeat: 2 })
```

This line calls the `makeItBetter` function with an option to repeat the improvement process twice. It triggers the enhancement process.

## How to Run the Script

To run this script using the GenAIScript CLI, you need to execute the following command in your terminal:

```bash
genaiscript run makeitbetter
```

For detailed instructions on installing and setting up the GenAIScript CLI, check out the [GenAIScript documentation](https://microsoft.github.io/genaiscript/getting-started).

By following these simple steps, you can harness AI to make your code better with ease! 🌟