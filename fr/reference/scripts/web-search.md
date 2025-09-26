La fonction `retrieval.webSearch` effectue une recherche web en utilisant [Tavily](https://docs.tavily.com/) ou Bing Web Search.

## Pages Web

Par défaut, l'API renvoie les 10 premières pages web dans le champ `webPages` sous forme d'un tableau de fichiers, de manière similaire à `env.files`. Le contenu contient l'extrait résumé retourné par le moteur de recherche.

```js
const webPages = await retrieval.webSearch("microsoft")
def("PAGES", webPages)
```

Vous pouvez utiliser `fetchText` pour télécharger le contenu complet de la page web.

## Configuration Tavily <a href="" id="tavily" />

L’[API Tavily](https://docs.tavily.com/docs/rest-api/api-reference#endpoint-post-search) donne accès à un moteur de recherche puissant pour les agents LLM.

```txt title=".env"
TAVILY_API_KEY="your-api-key"
```

## Configuration de Bing Web Search <a href="" id="bing" />

L'API utilise [Bing Web Search v7](https://learn.microsoft.com/en-us/bing/search-apis/bing-web-search/overview) pour effectuer des recherches sur le web. Pour utiliser l'API, vous devez créer une ressource Bing Web Search dans le portail Azure et stocker la clé API dans le fichier `.env`.

```txt title=".env"
BING_SEARCH_API_KEY="your-api-key"
```

## Outil

Ajoutez le script système [system.retrieval\_web\_search](https://github.com/microsoft/genaiscript/blob/main/packages/core/src/genaisrc/system.retrieval_web_search.genai.mjs) pour enregistrer un [outil](../../../reference/reference/scripts/tools/) qui utilise `retrieval.webSearch`.

```js
script({
    ...,
    system: ["system.retrieval_web_search"]
})
...
```