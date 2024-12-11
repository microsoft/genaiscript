
The `retrieval.webSearch` executes a web search using [Tavily](https://docs.tavily.com/) or the Bing Web Search.

## Web Pages

By default, the API returns the first 10 web pages in the `webPages` field
as an array of files, similarly to `env.files`. The content contains
the summary snippet returned by the search engine.

```js
const webPages = await retrieval.webSearch("microsoft")
def("PAGES", webPages)
```

You can use `fetchText` to download the full content of the web page.

## Tavily Configuration <a href="" id="tavily" />

The [Tavily API](https://docs.tavily.com/docs/rest-api/api-reference#endpoint-post-search)
provides access to a powerfull search engine for LLM agents.

```txt title=".env"
TAVILY_API_KEY="your-api-key"
```

## Bing Web Search configuration <a href="" id="bing" />

The API uses [Bing Web Search v7](https://learn.microsoft.com/en-us/bing/search-apis/bing-web-search/overview) to search the web. To use the API, you need to create a Bing Web Search resource in the Azure portal and store the API key in the `.env` file.

```txt title=".env"
BING_SEARCH_API_KEY="your-api-key"
```

## Tool

Add the [system.retrieval_web_search](https://github.com/microsoft/genaiscript/blob/main/packages/core/src/genaisrc/system.retrieval_web_search.genai.mjs) system script to register a [tool](/genaiscript/reference/scripts/tools) that uses `retrieval.webSearch`.

```js
script({
    ...,
    system: ["system.retrieval_web_search"]
})
...
```
