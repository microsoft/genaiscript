
GenAIScript provides various utilities to retrieve content and augment the prompt. This technique is typically referred to as **RAG** (Retrieval-Augmentation-Generation) in the literature.

## Vector Search

GenAIScript provides a tiny vector database based on [vectra](https://www.npmjs.com/package/vectra).
The `retrieve.vectorSearch` performs a embeddings search to find the most similar documents to the prompt.

```js
const files = await retrieval.vectorSearch("cat dog", env.files)
def("RAG", files)
```

The `files` variable contains a list of files, with concatenated fragments, that are most similar to the prompt. The `fragments` variable contains a list of fragments from the files that are most similar to the prompt.

## Fuzz Search

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
