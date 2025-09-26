Les modèles de raisonnement d'OpenAI, les modèles `o1, o3`, DeepSeek R1 ou Anthropic Sonnet 3.7, sont optimisés pour les tâches de raisonnement.

```js
script({
    model: "openai:o1",
})
```

:::tip
Vous pouvez expérimenter avec ces modèles sur Github Models également, mais la fenêtre contextuelle est assez petite.

```js
script({
    model: "github:openai/o3-mini",
})
```
:::

## Alias de Modèle

Les alias de modèles `reasoning` et `reasoning-small` [sont disponibles](../../../reference/reference/scripts/model-aliases/) pour les modèles de raisonnement.

```js
script({
    model: "openai:reasoning",
})
```

ou

```sh
genaiscript run ... -p openai -m reasoning
```

## Raisonnement, réflexion

GenAIScript extrait automatiquement le contenu de raisonnement/réflexion des réponses des modèles LLM.

## Effort de raisonnement

Le paramètre d'effort de raisonnement peut être défini sur `low`, `medium` ou `high`.

* configuré avec le paramètre `reasoningEffort`

```js 'reasoningEffort: "high"'
script({
    model: "openai:o3-mini"
    reasoningEffort: "high"
})
```

* en tant qu'étiquette au nom du modèle

```js 'openai:o3-mini:high'
script({
    model: "openai:o3-mini:high",
})
```

Pour Anthropic Sonnet 3.7, les efforts de raisonnement sont mappés aux valeurs `budget_token` suivantes :

* faible : 2048
* moyen : 4096
* élevé : 16384

## Limitations

* `o1-preview`, `o1-mini` ne prennent pas en charge le streaming
* les modèles `o1` ne prennent pas en charge l'appel d'outils, donc GenAIScript utilise des [outils de secours](../../../reference/reference/scripts/tools/).

## Conseils pour l'élaboration d'invites

OpenAI fournit des [conseils détaillés pour l'élaboration d'invites](https://platform.openai.com/docs/guides/reasoning#advice-on-prompting)
pour les modèles de raisonnement.