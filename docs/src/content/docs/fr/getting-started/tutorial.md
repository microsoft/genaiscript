---
title: Carnet de tutoriel
sidebar:
  order: 100
description: Apprenez à utiliser GenAIScript avec ce carnet tutoriel interactif
  contenant des blocs de code JavaScript exécutables.
keywords: tutorial, GenAIScript notebook, interactive learning, JavaScript, markdown
hero:
  image:
    alt: A simple 2D illustration uses geometric shapes to depict a computer screen
      displaying code blocks, alongside icons for files and chat messages. It
      features a recognizable script symbol, a document marked with hashtag and
      asterisk symbols, and a magic wand or spark conveying automation. The
      color scheme is limited to five bold corporate tones, with no people or
      background, and follows a flat, 8-bit style at small size.
    file: ../../getting-started/tutorial.png

---

Ce carnet est un tutoriel GenAIScript. C'est un document Markdown où chaque section de code JavaScript est un GenAIScript exécutable. Vous pouvez exécuter chaque bloc de code individuellement et voir les résultats dans la section de sortie sous le bloc de code. Pour ouvrir ce carnet dans Visual Studio Code, appuyez sur **F1** et lancez **GenAIScript : Créer un carnet Markdown GenAIScript**.

Suivez les étapes dans [configuration](https://microsoft.github.io/genaiscript/getting-started/configuration) pour configurer votre environnement et l'accès au LLM.

## Invite en tant que code

GenAIScript vous permet d’écrire des invites sous forme de programme JavaScript. GenAIScript exécute votre programme ; génère des messages de chat ; puis gère le reste de l’interaction avec l’API LLM.

### Écrire dans l’invite avec `$`

Commençons par un simple programme hello world.

```js
$`Say "hello!" in emojis`
```

<details>
  <summary>👤 utilisateur</summary>

  ```markdown wrap
  Say "hello!" in emojis
  ```
</details>

<details open>
  <summary>🤖 assistant </summary>

  ```markdown wrap
  👋😃!
  ```
</details>

La fonction `$` formate les chaînes et les écrit dans le message utilisateur. Ce message utilisateur est ajouté aux messages du chat et envoyé à l’API LLM. Sous l'extrait, vous pouvez consulter à la fois le message **utilisateur** (généré par notre programme) et la réponse de l’**assistant** (LLM).

Vous pouvez exécuter le bloc de code en cliquant sur le bouton **Exécuter la cellule** en haut à gauche du bloc de code. Par défaut, il utilisera les LLMs de différents fournisseurs. Si vous devez utiliser un autre modèle, mettez à jour le champ `model` dans l’en-tête YAML au début du document. De nombreuses options sont documentées dans [configuration](https://microsoft.github.io/genaiscript/getting-started/configuration).

Une fois l’exécution terminée, vous aurez également une entrée **trace** supplémentaire qui vous permet d’examiner les détails internes de l’exécution GenAIScript. Cela est très utile pour diagnostiquer les problèmes avec vos invites. La trace peut être assez volumineuse, elle n’est donc pas sérialisée dans le fichier markdown.

Vous pouvez utiliser la boucle JavaScript `for` et séquencer plusieurs appels `$` pour ajouter du texte au message utilisateur. Vous pouvez également utiliser des expressions internes pour générer du contenu dynamique.

```js
// let's give 3 tasks to the LLM
// to get 3 different outputs
for (let i = 1; i <= 3; i++) $`- Say "hello!" in ${i} emojis.`
$`Respond with a markdown list`
```

<details>
  <summary>👤 utilisateur</summary>

  ```markdown wrap
  -   Say "hello!" in 1 emojis.
  -   Say "hello!" in 2 emojis.
  -   Say "hello!" in 3 emojis.
      Respond with a markdown list
  ```
</details>

<details open>
  <summary>🤖 assistant </summary>

  ```markdown wrap
  -   👋
  -   👋😊
  -   👋✨😃
  ```
</details>

Pour récapituler, GenAIScript exécute et génère des messages utilisateur ; ceux-ci sont envoyés au LLM. Vous pouvez consulter le message utilisateur (et d’autres) dans la trace.

## `def` et `env.files`

La [`fonction def`](https://microsoft.github.io/genaiscript/reference/scripts/context/#definition-def) vous permet de déclarer et d’assigner des **variables LLM**. Le concept de variable est surtout utile pour importer des données contextuelles, en particulier des fichiers, et s’y référer dans le reste de l’invite.

```js
def("FILE", env.files)
$`Summarize FILE in one short sentence. Respond as plain text.`
```

<details>
  <summary>👤 utilisateur</summary>

  ````markdown wrap
  FILE:

  ```md file="src/samples/markdown.md"
  ---
  title: What is Markdown? - Understanding Markdown Syntax
  description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
  keywords: Markdown, markup language, formatting, plain text, syntax
  sidebar: mydoc_sidebar
  ---

  What is Markdown?
  Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

  Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

  For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
  ```

  Summarize FILE in one short sentence. Respond as plain text.
  ````
</details>

<details open>
  <summary>🤖 assistant </summary>

  ```markdown wrap
  Markdown is a lightweight markup language for formatting plain text, using syntax to indicate formatting elements.
  ```
</details>

Dans GenAIScript, la variable [`env.files`](https://microsoft.github.io/genaiscript/reference/scripts/context/#environment-env) contient la [liste des fichiers dans le contexte](https://microsoft.github.io/genaiscript/reference/script/files), qui peut être déterminée par une sélection utilisateur dans l’interface, les arguments CLI ou préconfigurée comme dans ce script. Vous pouvez modifier les fichiers dans `env.files` en éditant le champ `files` dans l’en-tête YAML au début du document.

### Filtrage de `env.files`

Lorsque vous utilisez GenAIScript depuis l’interface utilisateur, il est courant d’appliquer un script à un dossier entier. Cela signifie que vous recevrez un ensemble de fichiers dans `env.files`, y compris certains non nécessaires. La fonction `def` offre différentes options pour filtrer les fichiers, comme l’option `endsWith`.

`def` propose également `maxTokens` qui tronque la taille du contenu à un nombre de tokens. Le contexte LLM est limité !

```js
script({ files: "src/**" }) // glob all files under src/samples
def("FILE", env.files, { endsWith: ".md", maxTokens: 1000 }) // only consider markdown files
$`Summarize FILE in one short sentence. Respond as plain text.`
```

<details>
  <summary>👤 utilisateur</summary>

  ````markdown wrap
  FILE:

  ```md file="src/samples/markdown.md"
  ---
  title: What is Markdown? - Understanding Markdown Syntax
  description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
  keywords: Markdown, markup language, formatting, plain text, syntax
  sidebar: mydoc_sidebar
  ---

  What is Markdown?
  Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

  Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

  For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
  ```

  Summarize FILE in one short sentence. Respond as plain text.
  ````
</details>

<details open>
  <summary>🤖 assistant </summary>

  ```markdown wrap
  Markdown is a lightweight markup language for formatting plaintext documents, different from WYSIWYG editors.
  ```
</details>

## Outils

Vous pouvez enregistrer des fonctions JavaScript comme outils que le LLM appellera selon les besoins.

```js
// requires openai, azure openai or github models
defTool(
    "fetch",
    "Download text from a URL",
    { url: "https://..." },
    ({ url }) => host.fetchText(url)
)

$`Summarize https://raw.githubusercontent.com/microsoft/genaiscript/main/README.md in 1 sentence.`
```

## Sous-invite

Vous pouvez exécuter des LLM imbriqués pour effectuer des tâches sur d’autres modèles plus petits.

```js
// summarize each files individually
for (const file of env.files) {
    const { text } = await runPrompt((_) => {
        _.def("FILE", file)
        _.$`Summarize the FILE.`
    })
    def("FILE", { ...file, content: text })
}
// summarize all summaries
$`Summarize FILE.`
```
