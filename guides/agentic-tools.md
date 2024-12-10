
import { Steps } from "@astrojs/starlight/components"

[Agentic](https://agentic.so) ([GitHub](https://github.com/transitive-bullshit/agentic)) is
a standard library of AI functions / tools
which are optimized for both normal TS-usage as well as LLM-based usage.
You can register any agentic tool in your script using [defTool](/genaiscript/reference/scripts/tools).

The full list of agentic tools can be found at [https://agentic.so/tools/](https://agentic.so/tools).
Among others, you will find tools for:

-   [Bing](https://agentic.so/tools/bing)
-   [Calculator](https://agentic.so/tools/calculator)
-   [Clearbit](https://agentic.so/tools/clearbit)
-   [Dexa](https://agentic.so/tools/dexa)
-   [Diffbot](https://agentic.so/tools/diffbot)
-   [E2b](https://agentic.so/tools/e2b)
-   [Exa](https://agentic.so/tools/exa)
-   [Firecrawl](https://agentic.so/tools/firecrawl)
-   [Hacker news](https://agentic.so/tools/hacker-news)
-   [Hunter](https://agentic.so/tools/hunter)
-   [Jina](https://agentic.so/tools/jina)
-   [Midjourney](https://agentic.so/tools/midjourney)
-   [Novu](https://agentic.so/tools/novu)
-   [People data labs](https://agentic.so/tools/people-data-labs)
-   [Perigon](https://agentic.so/tools/perigon)
-   [Polygon](https://agentic.so/tools/polygon)
-   [Predict leads](https://agentic.so/tools/predict-leads)
-   [Proxycurl](https://agentic.so/tools/proxycurl)
-   [Searxng](https://agentic.so/tools/searxng)
-   [Serpapi](https://agentic.so/tools/serpapi)
-   [Serper](https://agentic.so/tools/serper)
-   [Slack](https://agentic.so/tools/slack)
-   [Social data](https://agentic.so/tools/social-data)
-   [Tavily](https://agentic.so/tools/tavily)
-   [Twilio](https://agentic.so/tools/twilio)
-   [Twitter](https://agentic.so/tools/twitter)
-   [Weather](https://agentic.so/tool/weather)
-   [Wikidata](https://agentic.so/tools/wikidata)
-   [Wikipedia](https://agentic.so/tools/wikipedia)
-   [Wolfram alpha](https://agentic.so/tools/wolfram-alpha)

## Using a tool

We will use the [calculator tool](https://agentic.so/tools/calculator)
as it does not require any secret.

<Steps>

<ol>

<li>

Find the tool documentation page ([https://agentic.so/tools/calculator](https://agentic.so/tools/calculator))
and install the dependencies.

```sh
npm install @agentic/core @agentic/calculator
```

</li>

<li>

Configure the required environment variables in your `.env` file.
In this case, the calculator tool does not require any secret but most do.

</li>

<li>

Import the tool function and register it with `defTool`.

```js "defTool(calculator)"
import { calculator } from "@agentic/calculator"
defTool(calculator)

$`...`
```

or in a subrompt

```js "_.defTool(calculator)"
import { calculator } from "@agentic/calculator"
await runPrompt((_) => {
    _.defTool(calculator)

    _.$`...`
})
```

</li>

</ol>

</Steps>

That's it! The agentic function have all the necessary metadata
to register the function with the LLM and execute it.

## Weather example

The [weather tool](https://agentic.so/tools/weather)
uses the [https://www.weatherapi.com/](https://www.weatherapi.com/) APIs.

<Steps>

<ol>

<li>

Install the `@agentic/weather` package.

```sh
npm install @agentic/core @agentic/weather
```

</li>

<li>

Configure the `WEATHER_API_KEY` environment variables in your `.env` file.

</li>

<li>

Import the client type, create an instance and register it with `defTool`.

```js
import { WeatherClient } from "@agentic/weather"
const weather = new WeatherClient()
defTool(weather)

$`...`
```

</li>

</ol>

</Steps>