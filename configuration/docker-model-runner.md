import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../components/LLMProviderFeatures.astro";

The `docker` provider connects to the [Docker Model Runner](https://docs.docker.com/model-runner/) local server.
It assumes GenAIScript is running in a container uses the `http://model-runner.docker.internal/engines/v1/` endpoint by default.

<Steps>

<ol>

<li>

Install [Docker](https://docs.docker.com/)

</li>

</ol>

</Steps>

To use Docker Model RRunner models, use the `docker:modelid` syntax.
If you change the default server URL, you can set the `DOCKER_MODEL_RUNNER_API_BASE` environment variable.

```txt title=".env"
DOCKER_MODEL_RUNNER_API_BASE=...
```

<LLMProviderFeatures provider="docker" />