
import { Image } from "astro:assets"
import src from "../../../assets/debugger.png"
import alt from "../../../assets/debugger.png.txt?raw"

The GenAIScript script files are executable JavaScript and can be debugged
using the [Visual Studio Code Debugger](https://code.visualstudio.com/Docs/editor/debugging), just like any other JavaScript program.

<Image src={src} alt={alt} />

## Starting a debugging session

-   Open the `.genai.mjs` file to debug and add breakpoints.

### From the env files

-   Right click in the editor of the file you want in `env.files`.
-   Select the GenAiScript from the picker.

### From the opened editors

-   Open side-by-side the GenAIScript source and the files you want in `env.files`.
-   Right click in GenAIScript editor and click **Debug GenAIScript...**.

#### From the script itself

-   Add a `files` field in the `script` function

```js
script({
    ...,
    files: "*.md"
})
```

-   Click on the **Debug** icon button on the editor menu (hidden under the run button).

The debugger will launch the [cli](/genaiscript/reference/cli) and run the script in debug mode.
The debugger will stop at the breakpoints you set.

## Limitations

The JavaScript executes in an external node process. Therefore,

-   The trace preview and output is not supported while debugging.

## Next steps

Keep iterating the script or [add tests](/genaiscript/getting-started/testing-scripts).
