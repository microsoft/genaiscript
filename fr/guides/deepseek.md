Comme le mentionne DeepSeek, [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) et [DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-V3) sont des modèles de langage à grande échelle (LLM) avancés, qui ont attiré une attention significative pour leurs performances et leur rentabilité. Les innovations de DeepSeek mettent en évidence le potentiel d'atteindre des performances d'IA de haut niveau avec moins de ressources, remettant en question les normes existantes de l'industrie et suscitant des discussions sur la direction future du développement de l'IA.

Ces pages documentent les différentes options pour exécuter les LLM de DeepSeek.

## DeepSeek.com

[DeepSeek.com](https://deepseek.com) est un fournisseur de LLM qui développe les modèles DeepSeek.

* [Provider `deepseek`](../../configuration/deepseek/)

## Azure AI Foundry

[Azure AI Foundry](https://ai.azure.com) propose une facturation basée sur les jetons pour les modèles DeepSeek R1 et DeepSeek V3. Voir [Annonce](https://techcommunity.microsoft.com/blog/machinelearningblog/announcing-deepseek-v3-on-azure-ai-foundry-and-github/4390438).

```js
script({
    model: "azure_ai_inference:deepseek-v3",
})
```

* [Provider `azure_ai_inference`](../../configuration/azure-ai-foundry/)

## Modèles GitHub Marketplace

[GitHub Marketplace Models](https://github.com/marketplace/models) offre une expérience gratuite pour expérimenter avec les modèles DeepSeek R1 et DeepSeek V3.

```js
script({
    model: "github:deepSeek-v3",
})
```

* [Provider `github`](../../configuration/github/)

## Et d'autres !

Ceci n'est en aucun cas une liste complète et il existe de nombreux autres fournisseurs capables d'exécuter les modèles DeepSeek.

* [Ollama](https://ollama.com/library/deepseek-v3) (si votre machine peut le gérer)
* [LM Studio](https://lmstudio.ai/models)
* ...