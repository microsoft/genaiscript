
import { Code } from "@astrojs/starlight/components"
import hostConfigurationSource from "../../../../../packages/core/src/hostconfiguration.ts?raw"

GenAIScript supports local and global configuration files to allow reusing common configuration settings and secrets across multiple scripts.

## File resolution

GenAIScript will scan for the following configuration files
and merge their content into the final configuration.

-   `~/genaiscript.config.yaml`
-   `~/genaiscript.config.json`
-   `./genaiscript.config.yaml`
-   `./genaiscript.config.json`

## File format

The configuration file format is the following:

<Code code={hostConfigurationSource} wrap={true} lang="ts" />

## `envFile` property

The final location of `envFile` will be used to load the secret in the environment variables.

## `include` property

The `include` property allows you to provide glob paths to include more scripts.
Combined with a global configuration file, this allows to share script for a number of projects.

```yaml title="genaiscript.config.yaml"
include:
    - "globalpath/*.genai.mjs"
```
