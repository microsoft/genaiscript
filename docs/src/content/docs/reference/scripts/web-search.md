---
title: Web Search
sidebar:
    order: 15
---

The `retreival.webSearch` executes a web search using the Bing Web Search API.

```js
const pages = await retreival.webSearch("microsoft")
```

## Bing Web Search configuration

The API uses [Bing Web Search v7](https://learn.microsoft.com/en-us/bing/search-apis/bing-web-search/overview) to search the web. To use the API, you need to create a Bing Web Search resource in the Azure portal and store the API key in the `.env` file.

```txt title=".env"
BING_SEARCH_API_KEY="your-api-key"
```

## Trace

You will find the internal details of the web search in the trace.
