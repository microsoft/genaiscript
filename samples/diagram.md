import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/vscode/genaisrc/diagram.genai.mts?raw"

This sample analyzes all the code in context and attempts to generate a diagram using [mermaid](https://mermaid.js.org/).

<Code code={source} wrap={true} lang="ts" title="diagram.genai.mts" />