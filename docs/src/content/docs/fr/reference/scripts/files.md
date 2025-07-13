---
title: Fichiers
description: Apprenez à effectuer des opérations sur le système de fichiers à
  l'aide de l'objet workspace dans vos scripts.
keywords: file system, workspace object, readText, findFiles, paths
sidebar:
  order: 13
hero:
  image:
    alt: A clean, flat 2D illustration in retro 8-bit style uses a five-color
      corporate palette. It displays a folder icon for workspace root,
      overlapping icons for PDF, DOCX, CSV, JSON, and XML files, along with
      simple gear and funnel icons symbolizing filtering and searching. A shield
      icon represents gitignore rules, and a pencil stands for output writing.
      All icons are geometric, minimalistic, and arranged compactly on a blank
      background.
    file: ../../../reference/scripts/files.png

---

GenAIScript permet d'accéder au système de fichiers de l'espace de travail et aux fichiers sélectionnés dans l'interface utilisateur.

Les chemins de fichiers sont enracinés dans le dossier d'espace de travail du projet. Dans Visual Studio Code, il s'agit du dossier racine ouvert (les espaces de travail multi-racines ne sont pas encore pris en charge). En ligne de commande, la racine de l'espace de travail correspond au répertoire de travail courant lors du lancement du CLI.

## `env.files`

La variable `env.files` contient un tableau de fichiers qui ont été sélectionnés par l'utilisateur via l'interface utilisateur ou la ligne de commande.

Vous pouvez passer `env.files` directement dans la fonction [def](../../../reference/reference/scripts/context/) et ajouter des filtres supplémentaires aux fichiers.

```js
def("PDFS", env.files, { endsWith: ".pdf" })
```

## `.gitignore` et `.gitignore.genai`

Par défaut, les fichiers `.gitignore` (au niveau de l'espace de travail) et `.gitignore.genai` (au niveau du projet) sont pris en compte lors de la sélection des fichiers.

Désactivez ce mode en définissant l'option `ignoreGitIgnore` à `true` :

```js
script({
    // don't filter env.files
    ignoreGitIgnore: true,
})
```

ou dans la commande `cli run` :

```sh
genaiscript run --ignore-git-ignore
```

`.gitignore.genai` est un fichier supplémentaire utilisé pour filtrer les fichiers du projet. Il est utile si vous souhaitez exclure certains fichiers du projet, qui ne sont pas pertinents pour le script, au-delà de ce que prévoit le fichier `.gitignore`.

## sortie de fichier

Utilisez [defFileOutput](../../../reference/reference/scripts/file-output/) pour spécifier les chemins autorisés pour la sortie de fichiers ainsi que la description de leur usage.

```js
defFileOutput("src/*.md", "Product documentation in markdown format")
```

## `workspace`

L'objet `workspace` permet d'accéder au système de fichiers de l'espace de travail.

### `findFiles`

Effectue une recherche de fichiers sous l'espace de travail. Les motifs glob sont pris en charge.

```ts
const mds = await workspace.findFiles("**/*.md")
def("DOCS", mds)
```

Les règles `.gitignore` sont respectées par défaut. Vous pouvez désactiver ce comportement en réglant l'option `ignoreGitIgnore` à `true`.

### `grep`

Effectue une recherche de fichiers par expression régulière ('grep') dans l'espace de travail à l'aide de [ripgrep](https://github.com/BurntSushi/ripgrep). Le motif peut être une chaîne de caractères ou une expression régulière.

```ts
const { files } = await workspace.grep("monkey", "**/*.md")
def("FILE", files)
```

Le motif peut aussi être une expression régulière, auquel cas la sensibilité dépend de l'option de la regex.

```ts
const { files } = await workspace.grep(/[a-z]+\d/i, "**/*.md")
def("FILE", files)
```

Les règles `.gitignore` sont respectées par défaut. Vous pouvez désactiver ce comportement en réglant l'option `ignoreGitIgnore` à `true`.

### `readText`

Lit le contenu d'un fichier sous forme de texte, relatif à la racine de l'espace de travail.

```ts
const file = await workspace.readText("README.md")
const content = file.content
```

Les fichiers PDF et DOCX sont automatiquement convertis en texte.

### `readJSON`

Lit le contenu d'un fichier au format JSON (utilise un parseur [JSON5](https://json5.org/)).

```ts
const data = await workspace.readJSON("data.json")
```

### `readXML`

Lit le contenu d'un fichier au format XML.

```ts
const data = await workspace.readXML("data.xml")
```

### `readCSV`

Lit le contenu d'un fichier au format CSV.

```ts
const data = await workspace.readCSV("data.csv")
```

En Typescript, vous pouvez typiser la sortie.

```ts '<{ name: string; value: number }>'
const data = await workspace.readCSV<{ name: string; value: number }>(
    "data.csv"
)
```

### `readData`

Cette API utilitaire tente d'inférer automatiquement le type de données et de les parser. Elle prend en charge JSON, JSON5, YAML, XML, INI, TOML, CSV, XLSX.

```js
const data = await workspace.readData("filename.csv")
```

### Validation du schéma

Vous pouvez fournir un [schéma JSON](../../../reference/reference/scripts/schemas/) pour valider les données analysées. Par défaut, les données invalides sont silencieusement ignorées et la valeur retournée est `undefined`, mais vous pouvez forcer l'API à lever une exception en utilisant `throwOnValidationError`.

```ts
const data = await workspace.readJSON("data.json", {
    schema: { type: "object", properties: { ... }, },
    throwOnValidationError: true
})
```

### `writeText`

Écrit du texte dans un fichier, relativement à la racine de l'espace de travail.

```ts
await workspace.writeText("output.txt", "Hello, world!")
```

### `appendText`

Ajoute du texte à un fichier, relativement à la racine de l'espace de travail.

```ts
await workspace.appendText("output.txt", "Hello, world!")
```

## paths

L'objet `paths` contient des méthodes utilitaires pour manipuler les noms de fichiers.

### Chemin courant vs chemin workspace

Par défaut, les fichiers sont résolus relativement à la racine de l'espace de travail. Vous pouvez utiliser l'objet `path` pour résoudre les chemins relatifs à la spécification courante, `env.spec`.

```ts
const cur = path.dirname(env.spec.filename)
const fs = path.join(cur, "myfile.md")
```

### motifs glob

Les "globs" de chemin de fichier sont des motifs utilisés pour faire correspondre des noms de fichiers et de dossiers. Ils sont couramment utilisés dans les systèmes d'exploitation de type Unix et dans les langages de programmation pour spécifier des ensembles de fichiers avec des caractères génériques. Cette section couvre les bases de l'utilisation des globs pour les chemins de fichiers avec workspace.findFiles.

Les motifs glob peuvent utiliser la syntaxe suivante :

* `*` pour correspondre à zéro ou plusieurs caractères dans un segment de chemin
* `?` pour correspondre à un seul caractère dans un segment de chemin
* `**` pour correspondre à n'importe quel nombre de segments de chemin, y compris aucun
* `{}` pour grouper des conditions (par exemple, `**/*.{ts,js}` correspond à tous les fichiers TypeScript et JavaScript)
* `[]` pour déclarer une plage de caractères à faire correspondre dans un segment de chemin (par ex. `example.[0-9]` pour example.0, example.1, ...)
* `[!...]` pour exclure une plage de caractères dans un segment de chemin (par ex. `example.[!0-9]` pour example.a, example.b, mais pas example.0)

Remarque : un antislash (`\`) n'est pas valide dans un motif glob. Si vous avez un chemin de fichier existant à faire correspondre, utilisez la prise en charge du motif relatif qui convertira tout antislash en slash. Sinon, veillez à remplacer chaque antislash par un slash lors de la création du motif glob.
