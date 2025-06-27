![A yellow square with the word "gen" in lowercase black letters above the uppercase black letters "AI."](./docs/public/images/favicon.png)

# GenAIScript&#x20;

## Le Prompting, c’est du code&#x20;

Assemblez des prompts pour les LLMs de manière programmatique en utilisant JavaScript. Orchestrez LLMs, outils et données dans du code.&#x20;

* Boîte à outils JavaScript pour travailler avec les prompts&#x20;

* Abstraction pour faciliter et rendre la productivité simple&#x20;

* Intégration transparente à Visual Studio Code ou ligne de commande flexible&#x20;

* Prise en charge intégrée de GitHub Copilot et des modèles GitHub, OpenAI, Azure OpenAI, Anthropic, et plus encore&#x20;

* 📄 **Lire la DOCUMENTATION EN LIGNE sur [microsoft.github.io/genaiscript ](https://microsoft.github.io/genaiscript/)**

* 💬 Rejoignez le [serveur Discord ](https://discord.gg/y7HpumjHeB)

* 📝 Lisez le [blog ](https://microsoft.github.io/genaiscript/blog/)pour les dernières actualités&#x20;

* 📺 Regardez [Mr. Maeda's Cozy AI Kitchen ](https://youtu.be/ajEbAm6kjI4)

* 🤖 Agents - consultez le [llms-full.txt ](https://microsoft.github.io/genaiscript/llms-full.txt)

***

## Hello world&#x20;

Supposons que vous souhaitez créer un script LLM qui génère un poème "hello world". Vous pouvez écrire le script suivant :&#x20;

```js
$`Write a 'hello world' poem.`;
```

La fonction `$`\`$\` est un tag de template qui crée un prompt. Le prompt est ensuite envoyé au LLM (que vous avez configuré), qui génère le poème.&#x20;

Rendons cela plus intéressant en ajoutant des fichiers, des données et une sortie structurée. Supposons que vous vouliez inclure un fichier dans le prompt, puis sauvegarder la sortie dans un fichier. Vous pouvez écrire le script suivant :&#x20;

```js
// read files
const file = await workspace.readText("data.txt");
// include the file content in the prompt in a context-friendly way
def("DATA", file);
// the task
$`Analyze DATA and extract data in JSON in data.json.`;
```

La fonction `def`\`def\` inclut le contenu du fichier et l’optimise si nécessaire pour le LLM ciblé. Le script GenAIScript analyse également la sortie du LLM
et extraira automatiquement le fichier `data.json`\`data.json\`.&#x20;

***

## 🚀 Guide de démarrage rapide&#x20;

Commencez rapidement en installant l’ [extension Visual Studio Code ](https://microsoft.github.io/genaiscript/getting-started/installation/)ou en utilisant la [ligne de commande ](https://microsoft.github.io/genaiscript/getting-started/installation).&#x20;

***

## ✨ Fonctionnalités&#x20;

### 🎨 JavaScript & TypeScript stylisés&#x20;

Construisez vos prompts de façon programmatique avec [JavaScript ](https://microsoft.github.io/genaiscript/reference/scripts/)ou [TypeScript ](https://microsoft.github.io/genaiscript/reference/scripts/typescript).&#x20;

```js
def("FILE", env.files, { endsWith: ".pdf" });
$`Summarize FILE. Today is ${new Date()}.`;
```

***

### 🚀 Boucle de développement rapide&#x20;

Éditez, [Déboguez ](https://microsoft.github.io/genaiscript/getting-started/debugging-scripts/), [Lancez ](https://microsoft.github.io/genaiscript/getting-started/running-scripts/)et [Testez ](https://microsoft.github.io/genaiscript/getting-started/testing-scripts/)vos scripts dans [Visual Studio Code ](https://microsoft.github.io/genaiscript/getting-started/installation)ou avec la [ligne de commande ](https://microsoft.github.io/genaiscript/getting-started/installation).&#x20;

***

### 🔗 Réutilisez et partagez vos scripts&#x20;

Les scripts sont des [fichiers ](https://microsoft.github.io/genaiscript/reference/scripts/)! Ils peuvent être versionnés, partagés et forkés.&#x20;

```js
// define the context
def("FILE", env.files, { endsWith: ".pdf" });
// structure the data
const schema = defSchema("DATA", { type: "array", items: { type: "string" } });
// assign the task
$`Analyze FILE and extract data to JSON using the ${schema} schema.`;
```

***

### 📋 Schémas de données&#x20;

Définissez, validez et réparez les données en utilisant des [schémas ](https://microsoft.github.io/genaiscript/reference/scripts/schemas). Prise en charge Zod intégrée.&#x20;

```js
const data = defSchema("MY_DATA", { type: "array", items: { ... } })
$`Extract data from files using ${data} schema.`
```

***

### 📄 Ingestion de texte depuis des PDFs, DOCX, ...&#x20;

Manipulez des [PDF ](https://microsoft.github.io/genaiscript/reference/scripts/pdf), [DOCX ](https://microsoft.github.io/genaiscript/reference/scripts/docx), ...&#x20;

```js
def("PDF", env.files, { endsWith: ".pdf" });
const { pages } = await parsers.PDF(env.files[0]);
```

***

### 📊 Ingestion de tableaux depuis CSV, XLSX, ...&#x20;

Manipulez des données tabulaires à partir de [CSV ](https://microsoft.github.io/genaiscript/reference/scripts/csv), [XLSX ](https://microsoft.github.io/genaiscript/reference/scripts/xlsx), ...&#x20;

```js
def("DATA", env.files, { endsWith: ".csv", sliceHead: 100 });
const rows = await parsers.CSV(env.files[0]);
defData("ROWS", rows, { sliceHead: 100 });
```

***

### 📝 Générer des fichiers&#x20;

Extrayez des fichiers et des diffs depuis la sortie du LLM. Prévisualisez les changements dans l’UI de refactoring.&#x20;

```js
$`Save the result in poem.txt.`;
```

```txt
FILE ./poem.txt
The quick brown fox jumps over the lazy dog.
```

***

### 🔍 Recherche de fichiers&#x20;

Effectuez des recherches "grep" ou floues dans des [fichiers ](https://microsoft.github.io/genaiscript/reference/scripts/files).&#x20;

```js
const { files } = await workspace.grep(/[a-z][a-z0-9]+/, { globs: "*.md" });
```

***

## Classifier&#x20;

Classifiez du texte, des images ou un mélange des deux.&#x20;

```js
const joke = await classify("Why did the chicken cross the road? To fry in the sun.", {
  yes: "funny",
  no: "not funny",
});
```

### Outils LLM&#x20;

Enregistrez des fonctions JavaScript en tant que [outils ](https://microsoft.github.io/genaiscript/reference/scripts/tools)(avec repli pour les modèles qui ne supportent pas les outils). Les [outils MCP – Model Context Protocol ](https://microsoft.github.io/genaiscript/reference/scripts/mcp-tools)sont également pris en charge.&#x20;

```js
defTool(
  "weather",
  "query a weather web api",
  { location: "string" },
  async (args) => await fetch(`https://weather.api.api/?location=${args.location}`),
);
```

***

### Agents LLM&#x20;

Enregistrez des fonctions JavaScript comme **outils&#x20;**&#x65;t combinez outils + prompt dans des agents.&#x20;

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

utilisez-le ensuite comme un outil&#x20;

```js
script({ tools: "agent_git" });

$`Do a statistical analysis of the last commits`;
```

Voir la source de l’agent git [ici ](https://github.com/microsoft/genaiscript/blob/main/packages/cli/genaisrc/system.agent_git.genai.mts).&#x20;

***

### 🔍 RAG intégré&#x20;

[Recherche vectorielle ](https://microsoft.github.io/genaiscript/reference/scripts/vector-search/).&#x20;

```js
const { files } = await retrieval.vectorSearch("cats", "**/*.md");
```

***

### 🐙 Modèles GitHub et GitHub Copilot&#x20;

Exécutez des modèles via [GitHub Models ](https://microsoft.github.io/genaiscript/configuration/github)ou [GitHub Copilot ](https://microsoft.github.io/genaiscript/configuration/github-copilot-chat).&#x20;

```js
script({ ..., model: "github:gpt-4o" })
```

***

### 💻 Modèles locaux&#x20;

Exécutez vos scripts avec des [modèles open source ](https://microsoft.github.io/genaiscript/getting-started/configuration/), comme [Phi-3 ](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/), en utilisant [Ollama ](https://ollama.com/), [LocalAI ](https://localai.io/).&#x20;

```js
script({ ..., model: "ollama:phi3" })
```

***

### 🐍 Interpréteur de code&#x20;

Laissez le LLM exécuter du code dans un environnement protégé (sandbox).&#x20;

```js
script({ tools: ["python_code_interpreter"] });
```

***

### 🐳 Conteneurs&#x20;

Exécutez du code dans des conteneurs [Docker ](https://microsoft.github.io/genaiscript/reference/scripts/container).&#x20;

```js
const c = await host.container({ image: "python:alpine" });
const res = await c.exec("python --version");
```

***

### Traitement vidéo&#x20;

Transcrivez et capturez vos vidéos afin de les exploiter efficacement dans vos requêtes LLM.&#x20;

```js
// transcribe
const transcript = await transcript("path/to/audio.mp3");
// screenshots at segments
const frames = await ffmpeg.extractFrames("path_url_to_video", { transcript });
def("TRANSCRIPT", transcript);
def("FRAMES", frames);
```

### 🧩 Composition LLM&#x20;

[Faites tourner des LLMs ](https://microsoft.github.io/genaiscript/reference/scripts/inline-prompts/)pour construire vos prompts LLM.&#x20;

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

### 🅿️ Support Prompty&#x20;

Importez vos fichiers [Prompty ](https://prompty.ai)dans vos scripts.&#x20;

```js
importTemplate("summarize.prompty");
```

***

### Analyse de secrets modulable&#x20;

Analysez vos discussions pour détecter les secrets à l’aide de [l’analyse de secrets ](/genaiscript/reference/scripts/secret-scanning).&#x20;

```json
{
    "secretPatterns": {
        ...,
        "OpenAI API Key": "sk-[A-Za-z0-9]{32,48}"
    }
}
```

### ⚙ Automatisez avec CLI ou API&#x20;

Automatisez avec la [CLI ](https://microsoft.github.io/genaiscript/reference/cli)ou l’ [API ](https://microsoft.github.io/genaiscript/reference/api).&#x20;

```bash
npx genaiscript run tlaplus-linter "*.tla"
```

ou utilisez l’ [API Node.JS ](/genaiscript/reference/api)pour exécuter des scripts de manière programmatique :&#x20;

```js
import { run } from "@genaiscript/api";

const res = await run("tlaplus-linter", "*.tla");
```

***

### Sécurité avant tout !&#x20;

GenAIScript fournit des prompts système pour l’IA responsable et un support intégré pour Azure Content Safety afin de valider la [sécurité des contenus ](https://microsoft.github.io/genaiscript/reference/scripts/content-safety).&#x20;

```js wrap
script({ ...,
    system: ["system.safety_harmful_content", ...],
    contentSafety: "azure" // use azure content safety
})

const safety = await host.contentSafety()
const res = await safety.detectPromptInjection(env.vars.input)
```

***

### 💬 Revues de Pull Request&#x20;

Intégrez-vous à vos [vérifications de Pull Requests ](https://microsoft.github.io/genaiscript/reference/cli/run/#pull-requests)via des commentaires, revues ou mises à jour de description. Supporte GitHub Actions et Azure DevOps Pipelines.&#x20;

```bash wrap
npx genaiscript ... --pull-request-reviews
```

***

### ⭐ Tests et évaluations&#x20;

Construisez des prompts fiables à l’aide de [tests et évaluations ](https://microsoft.github.io/genaiscript/reference/scripts/tests)propulsés par [promptfoo ](https://promptfoo.dev/).&#x20;

```js wrap
script({ ..., tests: {
  files: "penguins.csv",
  rubric: "is a data analysis report",
  facts: "The data refers about penguin population in Antarctica.",
}})
```

***

### Docs adaptées aux LLMs&#x20;

L’intégralité du contenu de la documentation est disponible sur [https://microsoft.github.io/genaiscript/llms-full.txt ](https://microsoft.github.io/genaiscript/llms-full.txt)au format markdown. Donnez-la directement à votre système RAG préféré.&#x20;

Si vous êtes un crawler LLM, ajoutez le suffixe `.md`.md [https://microsoft.github.io/genaiscript/guides/prompt-as-code.md ](https://microsoft.github.io/genaiscript/guides/prompt-as-code.md)(notez l’extension .md)&#x20;

## Contribuer&#x20;

Nous acceptons les contributions ! Consultez la page [CONTRIBUTING ](./CONTRIBUTING.md)pour les détails et la configuration développeur.&#x20;

***

## Marques déposées&#x20;

Ce projet peut contenir des marques ou logos relatifs à des projets, produits ou services. L’utilisation des marques ou logos Microsoft doit être autorisée et suivre les [Directives Microsoft relatives aux marques & à l’image de marque ](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
L’utilisation des marques ou logos Microsoft dans des versions modifiées de ce projet ne doit pas prêter à confusion ni sous-entendre un parrainage par Microsoft.
Toute utilisation de marques ou logos tiers est soumise aux règles de ces tiers.&#x20;

<hr/>

Traduit avec l'IA. Veuillez vérifier l'exactitude du contenu.&#x20;
