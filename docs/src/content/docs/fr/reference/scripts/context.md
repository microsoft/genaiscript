---
title: Contexte (env+def)
sidebar:
  order: 3
description: Documentation détaillée sur le contexte d'exécution des scripts et
  les variables d'environnement dans GenAIScript.
keywords: script execution, env object, GenAIScript context, def function, env files
hero:
  image:
    alt: A simplified 2D digital illustration displays a plain folder with several
      file icons above it, each symbolizing a different file type—PDF, Markdown,
      Python, and CSV—distinguished by subtle color differences. The files float
      in a curved arc above the folder. Shapes like divided rectangles and
      arrows suggest data comparison or file differences. A small cogwheel icon
      represents automation. The scene uses only five solid colors, with sharp
      boundaries and very minimal detail. All items are spaced apart on a blank,
      transparent background, with no text, people, shading, or
      three-dimensional effects.
    file: ../../../reference/scripts/context.png

---

Les informations sur le contexte d'exécution du script sont disponibles dans l'objet global `env`.

## Environnement (`env`)

L'objet global `env` contient des propriétés qui fournissent des informations sur le contexte d'exécution du script.
`env` est alimenté automatiquement par le moteur d'exécution GenAIScript.

### `env.files`

Le tableau `env.files` contient tous les fichiers inclus dans le contexte d'exécution. Ce contexte est défini implicitement
par l'utilisateur selon :

* l'option `files` de `script`

```js
script({
    files: "**/*.pdf",
})
```

ou plusieurs chemins

```js
script({
    files: ["src/*.pdf", "other/*.pdf"],
})
```

* l'endroit de l'UI où l'outil est lancé

* les arguments de fichiers du [CLI](../../../reference/reference/cli/).

Les fichiers sont stockés dans `env.files` qui peut être injecté dans l'invite.

* avec `def`

```js
def("FILE", env.files)
```

* filtré,

```js
def("DOCS", env.files, { endsWith: ".md" })
def("CODE", env.files, { endsWith: ".py" })
```

* directement dans un appel `$`

```js
$`Summarize ${env.files}.
```

Dans ce cas, l'invite est automatiquement agrandie avec un appel à `def` et la valeur de `env.files`.

```js
// expanded
const files = def("FILES", env.files, { ignoreEmpty: true })
$`Summarize ${files}.
```

### `env.vars`

La propriété `vars` contient les variables qui ont été définies dans le contexte d'exécution du script.

```javascript
// grab locale from variable or default to en-US
const locale = env.vars.locale || "en-US"
```

En savoir plus sur les [variables](../../../reference/reference/scripts/variables/).

## Définition (`def`)

La fonction `def("FILE", file)` est une abréviation pour générer une sortie de variable entourée de bornes (fence).

```js "def"
def("FILE", file)
```

Cela rend approximativement :

````markdown
FILE:

```file="filename"
file content
```
````

ou si le modèle supporte les balises XML (voir [formats de fences](../../../reference/reference/scripts/fence-formats/)) :

```markdown
<FILE file="filename">
file content
</FILE>
```

La fonction `def` peut aussi être utilisée avec un tableau de fichiers, comme `env.files`.

```js "env.files"
def("FILE", env.files)
```

### Langue

Vous pouvez spécifier la langue du texte contenu dans `def`. Cela peut aider GenAIScript à optimiser l'affichage du texte.

```js 'language: "diff"'
// hint that the output is a diff
def("DIFF", gitdiff, { language: "diff" })
```

### Référencement

La fonction `def` retourne un nom de variable qui peut être utilisé dans l'invite.
Le nom pourrait être formaté différemment pour s'adapter à la préférence du modèle.

```js "const f = "
const f = def("FILE", file)

$`Summarize ${f}.`
```

### Filtres de fichiers

Comme un script peut être exécuté sur un dossier entier, il est souvent utile de filtrer les fichiers selon

* leur extension

```js "endsWith: '.md'"
def("FILE", env.files, { endsWith: ".md" })
```

* ou en utilisant un [glob](https://en.wikipedia.org/wiki/Glob_\(programming\)) :

```js "glob: '**/*.{md,mdx}'"
def("FILE", files, { glob: "**/*.{md,mdx}" })
```

:::tip
Vous pouvez ouvrir le menu de complétion et découvrir toutes les options
en appuyant sur **Ctrl+Espace** après le caractère accolade `{`.

```js
def("FILE", env.files, { // press Ctrl+Space
```
:::

### Fichiers vides

Par défaut, si `def` est utilisé avec un tableau vide de fichiers, il annulera l'invite. Vous pouvez changer ce comportement
en définissant `ignoreEmpty` à `true`.

```js "ignoreEmpty: true"
def("FILE", env.files, { endsWith: ".md", ignoreEmpty: true })
```

### `maxTokens`

Il est possible de limiter le nombre de tokens générés par la fonction `def`. Cela peut être utile lorsque la sortie est trop volumineuse et que le modèle a une limite de tokens.
L'option `maxTokens` peut être définie à un nombre afin de limiter le nombre de tokens générés **pour chaque fichier individuel**.

```js "maxTokens: 100"
def("FILE", env.files, { maxTokens: 100 })
```

### Filtres de données

La fonction `def` traite de façon spéciale les fichiers de données comme [CSV](../../../reference/reference/scripts/csv/) et [XLSX](../../../reference/reference/scripts/xlsx/). Elle convertit automatiquement les données au format tableau markdown pour améliorer la tokenisation.

* `sliceHead`, garder les N premières lignes

```js "sliceHead: 100"
def("FILE", env.files, { sliceHead: 100 })
```

* `sliceTail`, garder les N dernières lignes

```js "sliceTail: 100"
def("FILE", env.files, { sliceTail: 100 })
```

* `sliceSample`, garder un échantillon aléatoire de N lignes

```js "sliceSample: 100"
def("FILE", env.files, { sliceSample: 100 })
```

### Mise en cache de l'invite

Vous pouvez utiliser `cacheControl: "ephemeral"` pour spécifier que l'invite peut être mise en cache
pour une courte période, et activer l'optimisation de cache d'invite, qui est prise en charge (différemment) selon les fournisseurs LLM.

```js 'cacheControl("ephemeral")'
$`...`.cacheControl("ephemeral")
```

```js '"cacheControl: "ephemeral"'
def("FILE", env.files, { cacheControl: "ephemeral" })
```

En savoir plus sur la [mise en cache de l'invite](../../../reference/reference/scripts/prompt-caching/).

### Sécurité : détection d'injection d'invite

Vous pouvez planifier un contrôle d'injection d'invite / brèche JAI avec votre fournisseur [content safety](../../../reference/reference/scripts/content-safety/) configuré.

```js "detectPromptInjection: true"
def("FILE", env.files, { detectPromptInjection: true })
```

### Sortie prédite

Certains modèles, comme OpenAI gpt-4o et gpt-4o-mini, prennent en charge la spécification d'une [sortie prédite](https://platform.openai.com/docs/guides/predicted-outputs) (avec certaines [limitations](https://platform.openai.com/docs/guides/predicted-outputs#limitations)). Cela aide à réduire la latence des réponses du modèle lorsque la majeure partie de la réponse est prévisible.
Ceci peut être utile lorsque l'on demande au LLM de modifier des fichiers spécifiques.

Utilisez l'option `prediction: true` pour l'activer dans un appel à `def`. Notez qu'un seul fichier peut être prédit à la fois.

```js
def("FILE", env.files[0], { prediction: true })
```

:::note
Cette fonctionnalité désactive l'insertion des numéros de ligne.
:::

## Définition de données (`defData`)

La fonction `defData` offre des options de formatage supplémentaires pour convertir un objet de données en représentation textuelle. Elle supporte la conversion des objets au format YAML, JSON, ou CSV (sous forme de tableau Markdown).

```js
// render to markdown-ified CSV by default
defData("DATA", data)

// render as yaml
defData("DATA", csv, { format: "yaml" })
```

La fonction `defData` supporte également des fonctions pour découper les lignes et colonnes en entrée.

* `headers`, liste des noms de colonnes à inclure
* `sliceHead`, nombre de lignes ou de champs à inclure du début
* `sliceTail`, nombre de lignes ou de champs à inclure de la fin
* `sliceSample`, nombre de lignes ou de champs à choisir aléatoirement
* `distinct`, liste des noms de colonnes pour dédupliquer les données
* `query`, une requête [jq](https://jqlang.github.io/jq/) pour filtrer les données

```js
defData("DATA", data, {
    sliceHead: 5,
    sliceTail: 5,
    sliceSample: 100,
})
```

Vous pouvez également utiliser la fonctionnalité de filtrage des données
via `parsers.tidyData`.

## Définition de diff (`defDiff`)

Il est très courant de comparer deux ensembles de données et de demander au LLM d'analyser les différences. L'utilisation des diffs est un excellent moyen
de compresser l'information naturellement car on ne se concentre que sur les différences !

La fonction `defDiff` se charge de formater le diff de manière adaptée au raisonnement du LLM. Elle fonctionne de façon similaire à `def` et assigne
un nom au diff.

```js
// diff files
defDiff("DIFF", env.files[0], env.files[1])

// diff strings
defDiff("DIFF", "cat", "dog")

// diff objects
defDiff("DIFF", { name: "cat" }, { name: "dog" })
```

Vous pouvez exploiter la fonctionnalité de diff via `parsers.diff`.
