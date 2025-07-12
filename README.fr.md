![A yellow square with the word "gen" in lowercase black letters above the uppercase black letters "AI."](./docs/public/images/favicon.png)

# GenAIScript

## Le Prompting, c'est coder

Assemblez des prompts pour les LLMs de manière programmatique en utilisant JavaScript. Orchestrez des LLMs, des outils et des données dans du code.

* Boîte à outils JavaScript pour travailler avec des prompts

* Abstraction pour rendre cela facile et productif

* Intégration transparente avec Visual Studio Code ou ligne de commande flexible

* Support intégré pour GitHub Copilot et GitHub Models, OpenAI, Azure OpenAI, Anthropic, et plus encore

* 📄 **Lisez la DOCUMENTATION EN LIGNE sur [microsoft.github.io/genaiscript](https://microsoft.github.io/genaiscript/)**

* 💬 Rejoignez le [serveur Discord](https://discord.gg/y7HpumjHeB)

* 📝 Lisez le [blog](https://microsoft.github.io/genaiscript/blog/) pour les dernières nouvelles

* 📺 Regardez [Mr. Maeda's Cozy AI Kitchen](https://youtu.be/ajEbAm6kjI4)

* 🤖 Agents - consultez le fichier [llms-full.txt](https://microsoft.github.io/genaiscript/llms-full.txt)

***

## Bonjour le monde

Disons que vous voulez créer un script LLM qui génère un poème "bonjour le monde". Vous pouvez écrire le script suivant :

```js
$`Write a 'hello world' poem.`;
```

La fonction `$` est une balise de modèle qui crée un prompt. Ce prompt est ensuite envoyé au LLM (que vous avez configuré), qui génère le poème.

Rendons cela plus intéressant en ajoutant des fichiers, des données et une sortie structurée. Disons que vous voulez inclure un fichier dans le prompt, puis enregistrer la sortie dans un fichier. Vous pouvez écrire le script suivant :

```js
// read files
const file = await workspace.readText("data.txt");
// include the file content in the prompt in a context-friendly way
def("DATA", file);
// the task
$`Analyze DATA and extract data in JSON in data.json.`;
```

La fonction `def` inclut le contenu du fichier et l'optimise si nécessaire pour le LLM cible. Le script GenAIScript analyse également la sortie du LLM et extraira automatiquement le fichier `data.json`.

***

## 🚀 Guide de démarrage rapide

Commencez rapidement en installant l'[extension Visual Studio Code](https://microsoft.github.io/genaiscript/getting-started/installation/) ou en utilisant la [ligne de commande](https://microsoft.github.io/genaiscript/getting-started/installation).

***

## ✨ Fonctionnalités

### 🎨 JavaScript et TypeScript stylisés

Créez des prompts de manière programmatique en utilisant [JavaScript](https://microsoft.github.io/genaiscript/reference/scripts/) ou [TypeScript](https://microsoft.github.io/genaiscript/reference/scripts/typescript).

```js
def("FILE", env.files, { endsWith: ".pdf" });
$`Summarize FILE. Today is ${new Date()}.`;
```

***

### 🚀 Boucle de développement rapide

Modifiez, [déboguez](https://microsoft.github.io/genaiscript/getting-started/debugging-scripts/), [exécutez](https://microsoft.github.io/genaiscript/getting-started/running-scripts/) et [testez](https://microsoft.github.io/genaiscript/getting-started/testing-scripts/) vos scripts dans [Visual Studio Code](https://microsoft.github.io/genaiscript/getting-started/installation) ou avec la [ligne de commande](https://microsoft.github.io/genaiscript/getting-started/installation).

***

### 🔗 Réutilisez et partagez des scripts

Les scripts sont des [fichiers](https://microsoft.github.io/genaiscript/reference/scripts/)! Ils peuvent être versionnés, partagés et forkés.

```js
// define the context
def("FILE", env.files, { endsWith: ".pdf" });
// structure the data
const schema = defSchema("DATA", { type: "array", items: { type: "string" } });
// assign the task
$`Analyze FILE and extract data to JSON using the ${schema} schema.`;
```

***

### 📋 Schémas de données

Définissez, validez et réparez des données en utilisant des [schémas](https://microsoft.github.io/genaiscript/reference/scripts/schemas). Support intégré pour Zod.

```js
const data = defSchema("MY_DATA", { type: "array", items: { ... } })
$`Extract data from files using ${data} schema.`
```

***

### 📄 Ingérez du texte à partir de PDFs, DOCX, ...

Manipulez des [PDFs](https://microsoft.github.io/genaiscript/reference/scripts/pdf), [DOCX](https://microsoft.github.io/genaiscript/reference/scripts/docx), ...

```js
def("PDF", env.files, { endsWith: ".pdf" });
const { pages } = await parsers.PDF(env.files[0]);
```

***

### 📊 Ingérez des tableaux à partir de CSV, XLSX, ...

Manipulez des données tabulaires issues de [CSV](https://microsoft.github.io/genaiscript/reference/scripts/csv), [XLSX](https://microsoft.github.io/genaiscript/reference/scripts/xlsx), ...

```js
def("DATA", env.files, { endsWith: ".csv", sliceHead: 100 });
const rows = await parsers.CSV(env.files[0]);
defData("ROWS", rows, { sliceHead: 100 });
```

***

### 📝 Générer des fichiers

Extrayez des fichiers et effectuez un diff à partir de la sortie LLM. Prévisualisez les changements dans l'interface de refactoring.

```js
$`Save the result in poem.txt.`;
```

```txt
FILE ./poem.txt
The quick brown fox jumps over the lazy dog.
```

***

### 🔍 Recherche de fichiers

Recherchez via grep ou fuzzy des [fichiers](https://microsoft.github.io/genaiscript/reference/scripts/files).

```js
const { files } = await workspace.grep(/[a-z][a-z0-9]+/, { globs: "*.md" });
```

***

## Classer

Classifiez du texte, des images ou un mix de tout.

```js
const joke = await classify("Why did the chicken cross the road? To fry in the sun.", {
  yes: "funny",
  no: "not funny",
});
```

### Outils LLM

Enregistrez des fonctions JavaScript en tant qu'[outils](https://microsoft.github.io/genaiscript/reference/scripts/tools) (avec prise en charge des modèles qui ne supportent pas les outils). Les [outils du protocole Model Context (MCP)](https://microsoft.github.io/genaiscript/reference/scripts/mcp-tools) sont également pris en charge.

```js
defTool(
  "weather",
  "query a weather web api",
  { location: "string" },
  async (args) => await fetch(`https://weather.api.api/?location=${args.location}`),
);
```

***

### Agents LLM

Enregistrez des fonctions JavaScript en tant qu'**outils** et combinez outils + prompts dans des agents.

```js
defAgent(
  "git",
  "Query a repository using Git to accomplish tasks.",
  `Your are a helpful LLM agent that can use the git tools to query the current repository.
    Answer the question in QUERY.
    - The current repository is the same as github repository.`,
  { model, system: ["system.github_info"], tools: ["git"] },
);
```

ensuite, utilisez-le comme un outil

```js
script({ tools: "agent_git" });

$`Do a statistical analysis of the last commits`;
```

Consultez la [source de l'agent git](https://github.com/microsoft/genaiscript/blob/main/packages/cli/genaisrc/system.agent_git.genai.mts).

***

### 🔍 RAG intégré

[Recherche vectorielle](https://microsoft.github.io/genaiscript/reference/scripts/vector-search/).

```js
const { files } = await retrieval.vectorSearch("cats", "**/*.md");
```

***

### 🐙 Modèles GitHub et GitHub Copilot

Exécutez des modèles via [GitHub Models](https://microsoft.github.io/genaiscript/configuration/github) ou [GitHub Copilot](https://microsoft.github.io/genaiscript/configuration/github-copilot-chat).

```js
script({ ..., model: "github:gpt-4o" })
```

***

### 💻 Modèles locaux

Exécutez vos scripts avec des [modèles Open Source](https://microsoft.github.io/genaiscript/getting-started/configuration/), comme [Phi-3](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/), en utilisant [Ollama](https://ollama.com/), [LocalAI](https://localai.io/).

```js
script({ ..., model: "ollama:phi3" })
```

***

### 🐍 Interpréteur de code

Laissez le LLM exécuter du code dans un environnement d'exécution isolé.

```js
script({ tools: ["python_code_interpreter"] });
```

***

### 🐳 Containers

Exécutez du code dans des [containers Docker](https://microsoft.github.io/genaiscript/reference/scripts/container).

```js
const c = await host.container({ image: "python:alpine" });
const res = await c.exec("python --version");
```

***

### Traitement vidéo

Transcrivez et prenez des captures d'écran de vos vidéos afin de les utiliser efficacement dans vos requêtes LLM.

```js
// transcribe
const transcript = await transcript("path/to/audio.mp3");
// screenshots at segments
const frames = await ffmpeg.extractFrames("path_url_to_video", { transcript });
def("TRANSCRIPT", transcript);
def("FRAMES", frames);
```

### 🧩 Composition LLM

[Exécutez des LLMs](https://microsoft.github.io/genaiscript/reference/scripts/inline-prompts/) pour construire vos prompts LLM.

```js
for (const file of env.files) {
  const { text } = await runPrompt((_) => {
    _.def("FILE", file);
    _.$`Summarize the FILE.`;
  });
  def("SUMMARY", text);
}
$`Summarize all the summaries.`;
```

***

### 🅿️ Support Prompty

Importez vos fichiers [Prompty](https://prompty.ai) dans les scripts.

```js
importTemplate("summarize.prompty");
```

***

### Scan de secrets extensible

Scannez vos conversations pour détecter des secrets en utilisant le [scan de secrets](/genaiscript/reference/scripts/secret-scanning).

```json
{
    "secretPatterns": {
        ...,
        "OpenAI API Key": "sk-[A-Za-z0-9]{32,48}"
    }
}
```

### ⚙ Automatiser avec CLI ou API

Automatisez en utilisant la [CLI](https://microsoft.github.io/genaiscript/reference/cli) ou l'[API](https://microsoft.github.io/genaiscript/reference/api).

```bash
npx genaiscript run tlaplus-linter "*.tla"
```

ou utilisez l'[API Node.JS](/genaiscript/reference/api) pour exécuter des scripts de manière programmatique :

```js
import { run } from "@genaiscript/api";

const res = await run("tlaplus-linter", "*.tla");
```

***

### La sécurité avant tout !

GenAIScript fournit des prompts de système d'intelligence artificielle responsable intégrés et un support Azure Content Safety pour valider la [sécurité du contenu](https://microsoft.github.io/genaiscript/reference/scripts/content-safety).

```js wrap
script({ ...,
    system: ["system.safety_harmful_content", ...],
    contentSafety: "azure" // use azure content safety
})

const safety = await host.contentSafety()
const res = await safety.detectPromptInjection(env.vars.input)
```

***

### 💬 Revues de pull requests

Intégrez dans vos [vérifications de pull requests](https://microsoft.github.io/genaiscript/reference/cli/run/#pull-requests) via des commentaires, des critiques ou des mises à jour de description. Prend en charge les actions GitHub et les pipelines Azure DevOps.

```bash wrap
npx genaiscript ... --pull-request-reviews
```

***

### ⭐ Tests et évaluations

Créez des prompts fiables en utilisant des [tests et évaluations](https://microsoft.github.io/genaiscript/reference/scripts/tests) propulsés par [promptfoo](https://promptfoo.dev/).

```js wrap
script({ ..., tests: {
  files: "penguins.csv",
  rubric: "is a data analysis report",
  facts: "The data refers about penguin population in Antarctica.",
}})
```

***

### Documentation conviviale pour LLM

L'intégralité du contenu de la documentation est rendue en markdown à l'adresse <https://microsoft.github.io/genaiscript/llms-full.txt>. Intégrez-la directement dans votre système RAG préféré.

Si vous êtes un crawler LLM, ajoutez le suffixe `.md` à toute URL de la documentation pour obtenir un contenu brut en markdown. Par exemple, <https://microsoft.github.io/genaiscript/guides/prompt-as-code.md> (notez l'extension .md)

## Contribuer

Nous acceptons les contributions ! Consultez la page [CONTRIBUTING](./CONTRIBUTING.md) pour des détails et l'installation pour développeurs.

***

## Marques déposées

Ce projet peut contenir des marques ou des logos pour des projets, produits ou services. L'utilisation autorisée des marques ou logos Microsoft est soumise et doit respecter les [Directives Microsoft sur l'utilisation des marques et logos](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
L'utilisation des marques ou logos Microsoft dans des versions modifiées de ce projet ne doit pas créer de confusion ni laisser entendre un parrainage par Microsoft. Toute utilisation de marques ou logos de tiers est soumise aux politiques respectives de ces tiers.
