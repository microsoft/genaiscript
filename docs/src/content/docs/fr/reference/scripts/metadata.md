---
title: Métadonnées
sidebar:
  order: 2
description: Découvrez comment configurer les métadonnées des scripts pour
  améliorer la fonctionnalité et l'expérience utilisateur dans GenAIScript.
keywords: script metadata, configuration, LLM parameters, customization, script
  management
hero:
  image:
    alt: A small, square digital illustration in 8-bit flat style showing a
      simplified computer window. Inside are separated areas formed by
      rectangles and circles, each sectioned with bold, bright colors to
      represent different configuration settings—model, tokens, temperature, and
      group options—depicted with shapes like sliders, toggles, and labeled
      blocks. The design is clean with no text, people, backgrounds, or visual
      effects, emphasizing a clear, easy-to-distinguish layout.
    file: ../../../reference/scripts/metadata.png

---

Les invites utilisent l'appel de fonction `script({ ... })`
pour configurer le titre et d'autres éléments de l'interface utilisateur.

L'appel à `script` est optionnel et peut être omis si vous n'avez pas besoin de configurer l'invite.
Cependant, l'argument `script` doit être un littéral [JSON5](https://json5.org/) valide, car le script est analysé et non exécuté lors de l'extraction des métadonnées.

## Titre, description, groupe

Les champs `title`, `description` et `group` sont (facultatifs) utilisés dans l'interface utilisateur pour afficher l'invite.

```javascript
script({
    title: "Shorten", // displayed in UI
    // also displayed but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    group: "shorten", // see Inline prompts later
})
```

### système

Remplacez les invites système incluses dans le script. L'ensemble par défaut d'invites système est inféré dynamiquement à partir du contenu du script.

```js
script({
    ...
    system: ["system.files"],
})
```

### modèle

Vous pouvez spécifier l'identifiant du modèle LLM dans le script.
L'IntelliSense fourni par `genaiscript.g.ts` vous aidera à découvrir la liste des modèles pris en charge.
Utilisez les alias `large` et `small` pour sélectionner les modèles par défaut, quelle que soit la configuration.

```js
script({
    ...,
    model: "openai:gpt-4o",
})
```

:::tip
Vous pouvez remplacer le modèle à partir de la [CLI](../../../reference/reference/cli/)
:::

### maxTokens

Vous pouvez spécifier le nombre maximum de **tokens de complétion** LLM dans le script. La valeur par défaut n'est pas spécifiée.

```js
script({
    ...,
    maxTokens: 2000,
})
```

### maxToolCalls

Limite le nombre d'appels de fonction/outils autorisés pendant une génération. Cela est utile pour prévenir les boucles infinies.

```js
script({
    ...,
    maxToolCalls: 100,
})
```

### température

Vous pouvez spécifier la `température` LLM dans le script, entre `0` et `2`. La valeur par défaut est `0,8`.

```js
script({
    ...,
    temperature: 0.8,
})
```

### top\_p

Vous pouvez spécifier le paramètre `top_p` LLM dans le script. La valeur par défaut n'est pas spécifiée.

```js
script({
    ...,
    top_p: 0.5,
})
```

### graine

Pour certains modèles, vous pouvez spécifier la `graine` LLM dans le script, pour les modèles qui la prennent en charge. La valeur par défaut n'est pas spécifiée.

```js
script({
    ...,
    seed: 12345678,
})
```

### métadonnées

Vous pouvez spécifier un ensemble de paires clé-valeur de métadonnées dans le script. Cela activera les [complétions enregistrées](../../../reference/reference/scripts/stored-completions/) dans OpenAI et Azure OpenAI. Cela est utilisé à des fins de distillation et d'évaluation.

```js
script({
    ...,
    metadata: {
        name: "my_script",
    }
})
```

### Autres paramètres

* `unlisted: true`, ne pas l'afficher dans les listes pour l'utilisateur. Les modèles `system.*` sont automatiquement masqués.

Voir `genaiscript.d.ts` dans les sources pour plus de détails.

## `env.meta`

Vous pouvez consulter les métadonnées du script de niveau supérieur dans l'objet `env.meta`.

```js
const { model } = env.meta
```

## Résolution du modèle

Utilisez la fonction `host.resolveModel` pour résoudre un nom ou un alias de modèle vers son fournisseur et son nom de modèle.

```js wrap
const info = await host.resolveModel("large")
console.log(info)
```

```json
{
    "provider": "openai",
    "model": "gpt-4o"
}
```
