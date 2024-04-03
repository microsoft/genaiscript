---
title: Retrieval
sidebar:
    order: 10
---

GenAIScript provides various utilities to retreive content and augment the prompt. This technique is typically referred as **RAG** (Retrieval-Augmentation-Generation) in the literature. GenAIScript uses [llamaindex-ts](https://ts.llamaindex.ai/api/classes/VectorIndexRetriever) which supports many vector database vendors.

## Search

The `retreive.search` performs a embeddings search to find the most similar documents to the prompt. The search is performed using the [llamaindex-ts](https://ts.llamaindex.ai/api/classes/VectorIndexRetriever) library.

```js
const { files, fragments } = await retrieval.search("cat dog", env.files)
def("RAG", files)
```

The `files` variable contains a list of files, with concatenated fragments, that are most similar to the prompt. The `fragments` variable contains a list of fragments from the files that are most similar to the prompt.

### Indexing

By default, the retrieval uses [OpenAI text-embedding-ada-002](https://ts.llamaindex.ai/modules/embeddings/) embeddings. The first search might be slow as the files get indexed for the first time.

You can index your project using the [CLI](/genaiscript/reference/cli).

```sh
genaiscript retreive index "src/**"
```

:::tip

You can simulate an indexing command in Visual Studio Code by right-clicking on a folder and selecting **Retrieval** > **Index**. Once indexed, you can test search using **Retrieval** > **Search**.

:::

### Indexing configuration

You can control the chunk size, overlap and model used for index files. You can also create multiple indexes using the `indexName` option.

## Web Search

The `retrieval.webSearch` performs a web search using a search engine API. You will need to provide API keys for the search engine you want to use.

```js
const { webPages } = await retrieval.webSearch("cat dog")
def("RAG", webPages)
```

### Bing

To enable Bing search, configure the `BING_SEARCH_API_KEY` secret in your `.env` file. Learn more about [configuring the Bing Search API](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api).
