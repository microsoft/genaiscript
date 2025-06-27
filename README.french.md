![A yellow square with the word "gen" in lowercase black letters above the uppercase black letters "AI."](./docs/public/images/favicon.png)

# GenAIScript&#x20;

## Le prompt, c’est coder&#x20;

Assemblez de manière programmatique des prompts pour les LLMs en utilisant JavaScript. Orchestrez les LLMs, outils et données dans votre code.&#x20;

* Une boîte à outils JavaScript pour manipuler des prompts&#x20;

* Une abstraction pour rendre cela facile et productif&#x20;

* Intégration fluide avec Visual Studio Code ou ligne de commande flexible&#x20;

* Prise en charge intégrée de GitHub Copilot et GitHub Models, OpenAI, Azure OpenAI, Anthropic, et plus&#x20;

* 📄 Lisez la DOCUMENTATION EN LIGNE sur \[microsoft.github.io/genaiscript]\(https\://microsoft.github.io/genaiscript/) **Lisez la DOCUMENTATION EN LIGNE sur [microsoft.github.io/genaiscript ](https://microsoft.github.io/genaiscript/)**

* Rejoignez le [Serveur Discord ](https://discord.gg/y7HpumjHeB)

* Lisez le [blog ](https://microsoft.github.io/genaiscript/blog/)pour les dernières actualités&#x20;

* Regardez [Mr. Maeda's Cozy AI Kitchen ](https://youtu.be/ajEbAm6kjI4)

* 🤖 Agents - lisez le [llms-full.txt ](https://microsoft.github.io/genaiscript/llms-full.txt)

***

## Bonjour le monde&#x20;

Admettons que vous voulez créer un script LLM qui génère un poème « hello world ». Vous pouvez écrire le script suivant :&#x20;

```js
$`Write a 'hello world' poem.`;
```

La `$`fonction est un tag de template qui crée un prompt. Le prompt est ensuite envoyé au LLM (que vous avez configuré), lequel génère le poème.&#x20;

Rendons cela plus intéressant en ajoutant des fichiers, des données et une sortie structurée. Supposons que vous souhaitez inclure un fichier dans le prompt, puis sauvegarder la sortie dans un fichier. Vous pouvez écrire le script suivant :&#x20;

```js
// read files
const file = await workspace.readText("data.txt");
// include the file content in the prompt in a context-friendly way
def("DATA", file);
// the task
$`Analyze DATA and extract data in JSON in data.json.`;
```

La fonction `def`inclut le contenu du fichier et l’optimise si nécessaire pour le LLM cible. GenAIScript analyse aussi la sortie du LLM
et extraira automatiquement le fichier `data.json`\`data.json\`.&#x20;

***

## 🚀 Guide de démarrage rapide&#x20;

Commencez rapidement en installant l’ [extension Visual Studio Code ](https://microsoft.github.io/genaiscript/getting-started/installation/)ou en utilisant la [ligne de commande ](https://microsoft.github.io/genaiscript/getting-started/installation).
Démarrez rapidement en installant l'\[extension Visual Studio Code]\(https\://microsoft.github.io/genaiscript/getting-started/installation/) ou en utilisant la \[ligne de commande]\(https\://microsoft.github.io/genaiscript/getting-started/installation).&#x20;

***

## ✨ Fonctionnalités&#x20;

### 🎨 JavaScript & TypeScript stylisés&#x20;

Construisez des prompts de façon programmatique avec [JavaScript ](https://microsoft.github.io/genaiscript/reference/scripts/)ou [TypeScript ](https://microsoft.github.io/genaiscript/reference/scripts/typescript).
Créez des prompts de façon programmatique en utilisant \[JavaScript]\(https\://microsoft.github.io/genaiscript/reference/scripts/) ou \[TypeScript]\(https\://microsoft.github.io/genaiscript/reference/scripts/typescript).&#x20;

```js
def("FILE", env.files, { endsWith: ".pdf" });
$`Summarize FILE. Today is ${new Date()}.`;
```

***

### 🚀 Boucle de développement rapide&#x20;

Éditez, [Déboguez ](https://microsoft.github.io/genaiscript/getting-started/debugging-scripts/),
Modifiez, [Exécutez ](https://microsoft.github.io/genaiscript/getting-started/running-scripts/),
exécutez [Testez ](https://microsoft.github.io/genaiscript/getting-started/testing-scripts/)vos scripts dans [Visual Studio Code ](https://microsoft.github.io/genaiscript/getting-started/installation)ou avec la [ligne de commande ](https://microsoft.github.io/genaiscript/getting-started/installation).&#x20;

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

Définissez, validez et réparez vos données via des [schémas ](https://microsoft.github.io/genaiscript/reference/scripts/schemas). Prise en charge native de Zod.&#x20;

```js
const data = defSchema("MY_DATA", { type: "array", items: { ... } })
$`Extract data from files using ${data} schema.`
```

***

### 📄 Ingestion de texte depuis PDF, DOCX, ...&#x20;

Manipulez [PDF ](https://microsoft.github.io/genaiscript/reference/scripts/pdf),&#x20;
Manipulez [DOCX ](https://microsoft.github.io/genaiscript/reference/scripts/docx), ...&#x20;

```js
def("PDF", env.files, { endsWith: ".pdf" });
const { pages } = await parsers.PDF(env.files[0]);
```

***

### 📊 Ingestion de tableaux depuis CSV, XLSX, ...&#x20;

Manipulez des données tabulaires depuis [CSV ](https://microsoft.github.io/genaiscript/reference/scripts/csv),&#x20;
Manipulez des données tabulaires depuis [XLSX ](https://microsoft.github.io/genaiscript/reference/scripts/xlsx), ...&#x20;

```js
def("DATA", env.files, { endsWith: ".csv", sliceHead: 100 });
const rows = await parsers.CSV(env.files[0]);
defData("ROWS", rows, { sliceHead: 100 });
```

***

### 📝 Générez des fichiers&#x20;

Extrayez des fichiers et des diff à partir de la sortie du LLM. Prévisualisez les changements dans l’UI de refactoring.&#x20;

```js
$`Save the result in poem.txt.`;
```

```txt
FILE ./poem.txt
The quick brown fox jumps over the lazy dog.
```

***

### 🔍 Recherche de fichiers&#x20;

Grep ou fuzzy search dans vos [fichiers ](https://microsoft.github.io/genaiscript/reference/scripts/files).
Cherchez par grep ou recherche floue dans des&#x20;

```js
const { files } = await workspace.grep(/[a-z][a-z0-9]+/, { globs: "*.md" });
```

***

## Classifiez&#x20;

Classifiez du texte, des images, ou un mélange des deux.&#x20;

```js
const joke = await classify("Why did the chicken cross the road? To fry in the sun.", {
  yes: "funny",
  no: "not funny",
});
```

### Outils LLM&#x20;

Enregistrez des fonctions JavaScript comme [outils ](https://microsoft.github.io/genaiscript/reference/scripts/tools)(avec un fallback pour les modèles qui ne supportent pas les outils). [outils Model Context Protocol (MCP) ](https://microsoft.github.io/genaiscript/reference/scripts/mcp-tools)sont aussi supportés.&#x20;

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

utilisez-le alors comme un outil&#x20;

```js
script({ tools: "agent_git" });

$`Do a statistical analysis of the last commits`;
```

Voir la [source de l’agent git ](https://github.com/microsoft/genaiscript/blob/main/packages/cli/genaisrc/system.agent_git.genai.mts).
Voir la \[source de l’agent git]\(https\://github.com/microsoft/genaiscript/blob/main/packages/cli/genaisrc/system.agent\_git.genai.mts).&#x20;

***

### 🔍 RAG intégré&#x20;

[Recherche vectorielle ](https://microsoft.github.io/genaiscript/reference/scripts/vector-search/).
\[Recherche vectorielle]\(https\://microsoft.github.io/genaiscript/reference/scripts/vector-search/).&#x20;

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

Exécutez vos scripts avec des [modèles open source ](https://microsoft.github.io/genaiscript/getting-started/configuration/), comme [Phi-3 ](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/), grâce à [Ollama ](https://ollama.com/), [LocalAI ](https://localai.io/).&#x20;

```js
script({ ..., model: "ollama:phi3" })
```

***

### 🐍 Interpréteur de code&#x20;

Laissez le LLM exécuter du code dans un environnement isolé (sandboxé).&#x20;

```js
script({ tools: ["python_code_interpreter"] });
```

***

### 🐳 Conteneurs&#x20;

Exécutez du code dans des [conteneurs Docker ](https://microsoft.github.io/genaiscript/reference/scripts/container).
Exécutez du code dans des conteneurs Docker&#x20;

```js
const c = await host.container({ image: "python:alpine" });
const res = await c.exec("python --version");
```

***

### Traitement vidéo&#x20;

Transcrivez et capturez des images de vos vidéos pour fournir de l’information efficacement lors de vos requêtes LLM.&#x20;

```js
// transcribe
const transcript = await transcript("path/to/audio.mp3");
// screenshots at segments
const frames = await ffmpeg.extractFrames("path_url_to_video", { transcript });
def("TRANSCRIPT", transcript);
def("FRAMES", frames);
```

### 🧩 Composition de LLM&#x20;

[Exécutez des LLM ](https://microsoft.github.io/genaiscript/reference/scripts/inline-prompts/)pour construire vos prompts LLM.&#x20;

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

### 🅿️ Prise en charge de Prompty&#x20;

Importez vos fichiers [Prompty ](https://prompty.ai)dans vos scripts.&#x20;

```js
importTemplate("summarize.prompty");
```

***

### Scan de secrets modulaire&#x20;

Scannez vos conversations pour des secrets grâce au [secret scanning ](/genaiscript/reference/scripts/secret-scanning).
Analysez vos conversations à la recherche de secrets grâce à \[l’analyse des secrets]\(/genaiscript/reference/scripts/secret-scanning).&#x20;

```json
{
    "secretPatterns": {
        ...,
        "OpenAI API Key": "sk-[A-Za-z0-9]{32,48}"
    }
}
```

### ⚙ Automatisez avec CLI ou API&#x20;

Automatisez avec la [CLI ](https://microsoft.github.io/genaiscript/reference/cli)ou [API ](https://microsoft.github.io/genaiscript/reference/api).&#x20;

```bash
npx genaiscript run tlaplus-linter "*.tla"
```

ou utilisez l’ [API Node.JS ](/genaiscript/reference/api)pour exécuter vos scripts programmatiquement :&#x20;

```js
import { run } from "@genaiscript/api";

const res = await run("tlaplus-linter", "*.tla");
```

***

### Priorité à la sécurité !&#x20;

GenAIScript fournit des prompts système de Responsible AI intégrés et une prise en charge d’Azure Content Safety
pour valider la [sécurité du contenu ](https://microsoft.github.io/genaiscript/reference/scripts/content-safety).
GenAIScript propose des messages systèmes de Responsabilité IA intégrés et la prise en charge de la sécurité de contenu Azure pour valider la \[sécurité du contenu]\(https\://microsoft.github.io/genaiscript/reference/scripts/content-safety).&#x20;

```js wrap
script({ ...,
    system: ["system.safety_harmful_content", ...],
    contentSafety: "azure" // use azure content safety
})

const safety = await host.contentSafety()
const res = await safety.detectPromptInjection(env.vars.input)
```

***

### 💬 Reviews de Pull Requests&#x20;

Intégrez dans vos [vérifications de Pull Requests ](https://microsoft.github.io/genaiscript/reference/cli/run/#pull-requests)via des commentaires, reviews ou mises à jour de la description. Prise en charge des GitHub Actions et des pipelines Azure DevOps.&#x20;

```bash wrap
npx genaiscript ... --pull-request-reviews
```

***

### ⭐ Tests et évaluations&#x20;

Construisez des prompts fiables via des [tests et évaluations ](https://microsoft.github.io/genaiscript/reference/scripts/tests)propulsés par [promptfoo ](https://promptfoo.dev/).
Construisez des prompts fiables à l’aide de \[tests et évaluations]\(https\://microsoft.github.io/genaiscript/reference/scripts/tests) propulsés par \[promptfoo]\(https\://promptfoo.dev/).&#x20;

```js wrap
script({ ..., tests: {
  files: "penguins.csv",
  rubric: "is a data analysis report",
  facts: "The data refers about penguin population in Antarctica.",
}})
```

***

### Docs LLM-friendly&#x20;

L’intégralité de la documentation est rendue sur [https://microsoft.github.io/genaiscript/llms-full.txt ](https://microsoft.github.io/genaiscript/llms-full.txt)en markdown. Mettez-la directement dans votre système RAG préféré.&#x20;

Si vous êtes un crawler LLM, ajoutez le suffixe `.md`\`.md\` [https://microsoft.github.io/genaiscript/guides/prompt-as-code.md ](https://microsoft.github.io/genaiscript/guides/prompt-as-code.md)(remarquez l’extension .md)&#x20;

## Contribuer&#x20;

Nous acceptons les contributions ! Consultez la page [CONTRIBUTING ](./CONTRIBUTING.md)pour les détails et la configuration développeur.&#x20;

***

## Marques commerciales&#x20;

Ce projet peut contenir des marques ou logos pour des projets, produits ou services. L’utilisation autorisée des marques ou logos Microsoft est soumise et doit se conformer aux [directives sur les marques et la marque Microsoft ](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). L’utilisation de logos ou marques de Microsoft dans des versions modifiées de ce projet ne doit pas créer de confusion ni impliquer un parrainage par Microsoft.
Toute utilisation de logos ou marques de tiers est soumise aux politiques des tiers concernés.&#x20;


<hr/>

Translated using AI. Please verify the content for accuracy.

