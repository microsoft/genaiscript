import { YouTube } from "astro-embed"

GenAIScript provides various utilities to retrieve content and augment the prompt.
This technique is typically referred to as **RAG** (Retrieval-Augmentation-Generation) in the literature.

## Vector Search

GenAIScript provides various vector database to support embeddings (vector) search.

```js
// index creation
const index = await retrieval.index("animals")
// indexing
await index.insertOrUpdate(env.files)
// search
const res = await index.search("cat dog")
def("RAG", res)
```

- Read more about [vector search](/genaiscript/reference/scripts/vector-search) and how to use it.

## Fuzzy Search

The `retrieve.fuzzSearch` performs a "traditional" fuzzy search to find the most similar documents to the prompt.

```js
const files = await retrieval.fuzzSearch("cat dog", env.files)
```

## Web Search

The `retrieval.webSearch` performs a web search using a search engine API. You will need to provide API keys for the search engine you want to use.

```js
const { webPages } = await retrieval.webSearch("cat dog")
def("RAG", webPages)
```

### Bing

To enable Bing search, configure the `BING_SEARCH_API_KEY` secret in your `.env` file. Learn more about [configuring the Bing Search API](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api).