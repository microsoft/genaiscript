import { YouTube } from "astro-embed"

GenAIScript provides various vector database to support embeddings search and retrieval augmented generation (RAG).

```js
// index creation
const index = await retrieval.index("animals")
// indexing
await index.insertOrUpdate(env.files)
// search
const res = await index.search("cat dog")
def("RAG", res)
```

## Index creation

The `retrieve.index` creates or loads an existing index. The index creation takes a number
of options **which should not change** between executions.

```js
// index creation
const index = await retrieval.index("animals")
```

### Local Index

By default, vector are stored locally in files under the `.genaiscript/vector` folder using a local vector database based on [vectra](https://www.npmjs.com/package/vectra). The embeddings are computed
using the `embeddings` [model alias](/genaiscript/reference/scripts/model-aliases)

<YouTube id="https://youtu.be/-gBs5PW_F20" posterQuality="high" />

The `embeddings` can also be configured through the options.

```js
const index = await retrieval.index("animals", {
    embeddingsModel: "ollama:nomic-embed-text",
})
```

The index is serialized by default. If you wish to reset it on every execution, set `deleteIfExists: true`.

### Azure AI Search

GenAIScript also supports using an [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search) service.
The Azure AI Search uses the [simple query syntax](https://learn.microsoft.com/en-us/azure/search/query-simple-syntax).

```js
const index = retrieval.index("animals", { type: "azure_ai_search" })
```

To configure the service, you will need to set the `AZURE_AI_SEARCH_ENDPOINT`
and `AZURE_AI_SEARCH_API_KEY` environment variables in your `.env` file.
Please refer to the [Authentication documentation](https://learn.microsoft.com/en-us/javascript/api/overview/azure/search-documents-readme?view=azure-node-latest#authenticate-the-client) for more details.

```txt
AZURE_AI_SEARCH_ENDPOINT=https://{{service-name}}.search.windows.net/
AZURE_AI_SEARCH_API_KEY=...
```

Further index management can be done through the Azure Portal.

### Model and chunking configuration

The computation of embeddings is done through the
LLM APIs using the same authorization token as the LLM API.

```js wrap 'embeddingsModel: "ollama:all-minilm"'
const index = await retrieval.index("animals", {
    embeddingsModel: "ollama:all-minilm",
})
```

You can also configure the chunking of the input files.
You can change this by setting the `chunkSize` and `chunkOverlap` options.

```js
const index = await retrieval.index("animals", {
    chunkSize: 512,
    chunkOverlap: 0,
})
```

## Indexing

The `index.insertOrUpdate` functiont takes care of chunking, vectorizing and
updating the vector database.

```js "await index.insertOrUpdate(env.files)"
// indexing
await index.insertOrUpdate(env.files)
```

## Searching

The `index.search` performs a search (vector or hybrid) using the index.

```js wrap
const hits = await retrieval.search("keyword")
```

The returned value is an array of files with the resconstructed content from the matching chunks.

```js wrap
const hits = await retrieval.search("keyword")
def("FILE", files)
```