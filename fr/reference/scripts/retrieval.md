import { YouTube } from "astro-embed"

GenAIScript fournit divers outils pour récupérer du contenu et enrichir le prompt.
Cette technique est généralement appelée **RAG** (Retrieval-Augmentation-Generation) dans la littérature.

## Recherche par vecteurs

GenAIScript propose diverses bases de données vectorielles pour prendre en charge la recherche par embeddings (vecteurs).

```js
// index creation
const index = await retrieval.index("animals")
// indexing
await index.insertOrUpdate(env.files)
// search
const res = await index.search("cat dog")
def("RAG", res)
```

* Lisez-en plus sur la [recherche par vecteurs](../../../reference/reference/scripts/vector-search/) et comment l'utiliser.

## Recherche floue

La fonction `retrieve.fuzzSearch` effectue une recherche floue "traditionnelle" pour trouver les documents les plus similaires au prompt.

```js
const files = await retrieval.fuzzSearch("cat dog", env.files)
```

## Recherche sur le Web

La fonction `retrieval.webSearch` lance une recherche sur le Web en utilisant une API de moteur de recherche. Vous devez fournir des clés API pour le moteur de recherche que vous souhaitez utiliser.

```js
const { webPages } = await retrieval.webSearch("cat dog")
def("RAG", webPages)
```

### Bing

Pour activer la recherche Bing, configurez le secret `BING_SEARCH_API_KEY` dans votre fichier `.env`. En savoir plus sur [la configuration de l'API Bing Search](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api).