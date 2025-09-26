import { PackageManagers } from "starlight-package-managers";

These runtime helpers provide a friendly wrapper around the [ast-grep](https://ast-grep.github.io/).

## Installation

<PackageManagers pkg="@genaiscript/plugin-ast-grep" dev />

If you are using the plugin in a Node.JS environment, without a `.genai...` entry file, you will need
to initialize the [runtime](/genaiscript/reference/runtime) before using the plugin:

```ts
import { initialize } from "@genaiscript/runtime";

await initialize();
```

## Usage

See the [ast-grep](/genaiscript/reference/scripts/ast-grep) script for examples of how to use the plugin.