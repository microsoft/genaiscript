import { PackageManagers } from "starlight-package-managers"

The GenAIScript [cli](/genaiscript/reference/cli) also contains
a set of helpers written in GenAIScript. They can be imported
as the `genaiscript/runtime` module.

In order to use the runtime, you will need to install GenAIScript
in your project.

<PackageManagers pkg="genaiscript" dev />

## Helpers

- [cast](/genaiscript/reference/scripts/cast), cast any data to structured outputs
- [classify](/genaiscript/reference/scripts/classify), classify text
- [makeItBetter](/genaiscript/guides/make-it-better), tell the LLM to improve its result
- [pipeline](/genaiscript/guides/transformers-js), access to HuggingFace transformers

## Importing the runtime

The runtime is available as a module. You can import it
using the following code:

```js
import { cast } from "genaiscript/runtime"
```