import { Code } from '@astrojs/starlight/components';
import tavilyCode from "../../../../../../samples/sample/genaisrc/tavily.mjs?raw";
import scriptCode from "../../../../../../samples/sample/genaisrc/document-augmentor.genai.mjs?raw";

Ce guide montre comment utiliser TypeScript, un service de recherche tiers, et les [secrets](../../reference/scripts/secrets/) pour créer
un script qui augmente des documents avec des informations provenant du web.

L'objectif est de créer un script qui augmentera un document existant avec des informations
recueillies sur le web.

## Recherche Tavily

[Tavily](https://tavily.com/) est un service de recherche optimisé pour les LLM qui fournit une [API REST](https://docs.tavily.com/docs/tavily-api/rest_api).

L'API REST peut être invoquée en utilisant JavaScript [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
et nécessite une clé API.

Le script utilise la clé `TAVILY_API_KEY` qui devra être déclarée dans le script en utilisant cette fonction.

```ts "env.secrets.TAVILY_API_KEY"
const res = await fetch(..., {
    headers: {
        'api_key': env.secrets.TAVILY_API_KEY
    }
})
```

Nous définissons une fonction `tavilySearch` en [TypeScript](../../reference/scripts/typescript/) qui encapsule l'appel `fetch` et nous ajoutons des annotations de type pour offrir
une bonne expérience d'édition.

```ts
export async function tavilySearch(query: string): Promise<{
    answer: string
    query: string
    results: {
        title: string
        url: string
        content: string
        score: number
    }[]
}> { ... }
```

Le code source complet est le suivant :

<Code code={tavilyCode} wrap={true} lang="ts" title="tavily.mts" />

## Question -> Recherche -> Augmentation

Le script est divisé en 3 phases :

* exécuter une invite pour générer une question basée sur le contenu du document
* utiliser Tavily pour générer une réponse à la question
* exécuter une invite pour augmenter le document avec la réponse

Le secret `TAVILY_API_KEY` nécessaire pour Tavily est déclaré dans l'appel de la fonction `script`.
Assurez-vous également de l'ajouter à votre fichier `.env`.

```js 'secrets: ["TAVILY_API_KEY"],'
script({
    secrets: ["TAVILY_API_KEY"],
})
```

La fonction `tavilySearch` est importée en utilisant un [import](../../reference/scripts/imports/) dynamique.

```ts
const { tavilySearch } = await import("./tavily.mts")
const { answer } = await tavilySearch(question.text)
```

Le code source complet est le suivant :

<Code code={scriptCode} wrap={true} lang="ts" title="document-augmentor.genai.mts" />