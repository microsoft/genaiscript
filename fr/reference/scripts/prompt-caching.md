La mise en cache des invites est une fonctionnalité qui peut réduire le temps de traitement et les coûts pour les invites répétitives. Elle est prise en charge par divers fournisseurs de LLM, mais l'implémentation peut varier.

## `éphémère`

Vous pouvez marquer la section `def` ou la fonction `$` avec `cacheControl` défini comme `"éphémère"` pour activer l'optimisation de la mise en cache des invites. Cela signifie essentiellement qu'il est acceptable pour le fournisseur LLM de mettre en cache l'invite pendant une courte période.

```js
def("FILE", env.files, { cacheControl: "ephemeral" })
```

```js
$`Some very cool prompt`.cacheControl("ephemeral")
```

## Prise en charge par les fournisseurs de LLM

Dans la plupart des cas, l'indication `éphémère` est ignorée par les fournisseurs de LLM. Cependant, les cas suivants sont pris en charge :

### OpenAI, Azure OpenAI

La [mise en cache des invites](https://platform.openai.com/docs/guides/prompt-caching) du préfixe de l'invite est automatiquement activée par OpenAI. Toutes les annotations éphémères sont supprimées.

* [Documentation OpenAI](https://openai.com/index/api-prompt-caching/).

### Anthropic

L'annotation `éphémère` est convertie en un champ `'cache-control': { ... }` dans l'objet message.

Notez que la mise en cache des invites est toujours marquée comme bêta et n'est pas prise en charge dans tous les modèles (en particulier les plus anciens).

* [Documentation Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)