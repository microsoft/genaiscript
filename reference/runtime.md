import { PackageManagers } from "starlight-package-managers";

The GenAIScript runtime provides additional helpers and allows to use the runtime in any Node.JS application.

In order to use the runtime, you will need to install GenAIScript
in your project.

<PackageManagers pkg="@genaiscript/runtime" dev />

## Initialization

If you are using GenAIScript without the CLI or Visual Studio Code extension, you need to initialize the runtime before using any global types or functions.

```js
import { initialize } from "@genaiscript/runtime";

// runs this before using any global types
await initialize();
```

## Importing the runtime

The runtime is available as a module. You can import it using the following code:

```js
import { cast } from "@genaiscript/runtime";
```

## Globals

The runtime installs global parsers and inline prompt types. However, the global `$`, `def`, etc... is not available, online inline prompts.

## Helpers

- [cast](/genaiscript/reference/runtime/cast), cast any data to structured outputs
- [classify](/genaiscript/reference/runtime/classify), classify text
- [makeItBetter](/genaiscript/reference/runtime/make-it-better), tell the LLM to improve its result

## Plugins

The following helpers have been moved into their own packages to reduce the default installation size. They will require an additional installation step if you want to use them.

- Markdown AST parsing and manipulation [@genaiscript/plugin-mdast](/genaiscript/reference/runtime/plugin-mdast/)
- ast-grep, tree sitter rule matching and modifications, [@genaiscript/plugin-ast-grep](/genaiscript/reference/scripts/ast-grep/)
- MermaidJS diagram parsing [@genaiscript/plugin-mermaid](/genaiscript/reference/runtime/plugin-mermaid/)
- Pyodide Python execution in the browser [@genaiscript/plugin-pyodide](/genaiscript/reference/runtime/plugin-pyodide/)
- Z3 Solver execution [@genaiscript/plugin-z3](/genaiscript/reference/runtime/plugin-z3/)