Cette page est un tutoriel sur la création d'invite avec GenAIScript. Il est conçu pour être ouvert dans Visual Studio Code sous forme de carnet (Notebook).

:::tip
Pour suivre ce tutoriel dans Visual Studio Code,

1. Suivez les étapes dans [installation](../../getting-started/installation/) et [configuration](../../getting-started/configuration/) pour configurer votre environnement.

2. Ouvrez la palette de commandes (Ctrl+Shift+P) et exécutez la commande `GenAIScript: Create GenAIScript Markdown Notebook`.
:::

## À propos des carnets GenAIScript Markdown

Le [GenAIScript Markdown Notebook](../../reference/scripts/notebook/) analyse le document markdown en une vue Carnet et utilise le support de Visual Studio Code pour offrir une expérience d'édition enrichie. Il devrait fonctionner avec tout fichier markdown tant que le bloc de code utilise "\`\`\`".

* Chaque bloc de code **JavaScript** est un GenAIScript autonome qui peut être exécuté individuellement. Les résultats sont attachés à chaque bloc de code et sauvegardés dans le fichier markdown.
* Ceci est un noyau sans état, donc les variables ne sont pas partagées entre les blocs de code.
* D'autres langages ne sont pas pris en charge dans ce carnet et sont simplement ignorés.

## Invite en tant que code

GenAIScript vous permet d’écrire des invites sous forme de programme JavaScript. GenAIScript exécute votre programme ; génère des messages de chat ; puis gère le reste de l’interaction avec l’API LLM.

### `$`

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

Vous pouvez exécuter le bloc de code en cliquant sur le bouton **Exécuter la cellule** en haut à gauche du bloc de code. Par défaut, il utilisera le LLM `openai:gpt-3.5-turbo`. Si vous devez utiliser un modèle différent, mettez à jour le champ `model` dans les métadonnées en tête de document. De nombreuses options sont documentées dans [configuration](../../getting-started/configuration/).

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

Dans GenAIScript, la variable [`env.files`](https://microsoft.github.io/genaiscript/reference/scripts/context/#environment-env) contient la [liste des fichiers en contexte](../../reference/scripts/files/), qui peut être déterminée par une sélection utilisateur dans l'interface, des arguments CLI, ou préconfigurée comme dans ce script. Vous pouvez modifier les fichiers dans `env.files` en éditant le champ `files` dans les métadonnées en début de document.

### Filtrage

Lorsque vous utilisez GenAIScript depuis l’interface utilisateur, il est courant d’appliquer un script à un dossier entier. Cela signifie que vous recevrez un ensemble de fichiers dans `env.files`, y compris certains non nécessaires. La fonction `def` offre différentes options pour filtrer les fichiers, comme l’option `endsWith`.

`def` propose également `maxTokens` qui tronque la taille du contenu à un nombre de tokens. Le contexte LLM est limité !

```js
script({ files: "src/samples/**" }) // glob all files under src/samples
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