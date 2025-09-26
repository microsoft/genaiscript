import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

Les API `retrieval` ont été étendues pour prendre en charge [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search).
Cela vous permet d'indexer des fichiers à l'aide d'embeddings dans une base de données vectorielle pouvant être utilisée pour la recherche de similarité.
Cela est couramment appelé Generation Augmentée par Récupération (RAG).

```js wrap '{ type: "azure_ai_search" }'
// index creation
const index = retrieval.index("animals", {
  type: "azure_ai_search",
});
// indexing
await index.insertOrUpdate(env.files);
// search
const res = await index.search("cat dog");
def("RAG", res);
```

GenAIScript fournit un moyen simple et efficace d'interagir avec Azure AI Search. Il gère
le découpage, la vectorisation et l'indexation des fichiers. La fonction `retrieval.index` crée un index
avec le nom et le type spécifiés. La fonction `insertOrUpdate` indexe les fichiers dans la base de données.
Enfin, la fonction `search` récupère les fichiers qui correspondent à la requête.

Il est également possible d'utiliser l'interface en ligne de commande pour indexer les fichiers à l'avance.