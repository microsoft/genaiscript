
The `retrieval.vectorSearch` indexes the input files using [embeddings](https://platform.openai.com/docs/guides/embeddings) into a vector database that can be used for similarity search. This is commonly referred to as Retrieval Augmented Generation (RAG).

```js wrap
const files = await retrieval.vectorSearch("keyword", env.files)
```

The returned value is an array of files with the resconstructed content from the matching chunks.

```js wrap
const files = await retrieval.vectorSearch("keyword", env.files)
def("FILE", files)
```

## Model configuration

The computation of embeddings is done through the
LLM APIs using the same authorization token as the LLM API. 

The default model is `openai:text-embedding-ada-002` but you can override the model using `embedModel`.

```js wrap 'embedModel: "ollama:all-minilm"'
const files = await retrieval.vectorSearch(
    "keyword", 
    env.files, {
        embedModel: "ollama:all-minilm"
    })
```

You can further customize the embedding generation by using `chunkSize` and `chunkOverlap`.

## Index name

If you modify the model or chunking configurations, you will want to create separate index databases.

```js wrap 'indexName: "all-minilm"'
const files = await retrieval.vectorSearch(
    "keyword", 
    env.files, {
        indexName: "all-minilm",
        embedModel: "ollama:all-minilm"
    })
```

## Installation requirements

The retrieval uses [LLamaindex TS](https://ts.llamaindex.ai/) for indexing and searching.

The `llamaindex` package will be automatically installed.
