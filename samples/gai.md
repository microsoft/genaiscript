import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/gai.genai.mts?raw"
import gasource from "../../../../../.github/workflows/genai-investigator.yml?raw"

This is an in-depth guide to build a script that interactively investigates GitHub Actions failures.

## Full source ([GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/gai.genai.mts))

<Code code={source} wrap={true} lang="ts" title="gai.genai.mts" />

<Code code={gasource} wrap={true} lang="yaml" title="gai.yml" />
