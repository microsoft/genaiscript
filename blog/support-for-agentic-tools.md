
[Agentic](https://agentic.so/) is a standard library of TypeScript AI tools optimized for both TS-usage as well as LLM-based usage, which is really important for testing and debugging.

Agentic brings support for a variety of online APIs, like Bing, Wolfram Alpha, Wikipedia, and more. You can register any [Agentic tool](https://agentic.so/tools/) in your script using `defTool`. Here's an example of how to use the Weather tool:

```js
import { WeatherClient } from "@agentic/weather"
const weather = new WeatherClient()
defTool(weather)
```

-   [Agentic documentation](https://agentic.so/sdks/genaiscript)
-   [GenAIScript documentation](https://microsoft.github.io/genaiscript/guides/agentic-tools/)
