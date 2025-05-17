import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

The `retrieval` APIs has been extended to support [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search).
This allows you to index files using embeddings into a vector database that can be used for similarity search.
This is commonly referred to as Retrieval Augmented Generation (RAG).

```js wrap '{ type: "azure_ai_search" }'
// index creation
const index = retrieval.index("animals", { type: "azure_ai_search" })
// indexing
await index.insertOrUpdate(env.files)
// search
const res = await index.search("cat dog")
def("RAG", res)
```

GenAIScript provides a simple and efficient way to interact with Azure AI Search. It will handle
chunking, vectorization, and indexing of the files. The `retrieval.index` function creates an index
with the specified name and type. The `insertOrUpdate` function indexes the files into the database.
Finally, the `search` function retrieves the files that match the query.

One can also use the command line interface to index files ahead of time.