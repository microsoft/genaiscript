![A yellow square with the word "gen" in lowercase black letters above the uppercase black letters "AI."](./docs/public/images/favicon.png)

# GenAIScript&#x20;

## Prompting é Programação&#x20;

Monte prompts para LLMs usando JavaScript de forma programática. Orquestre LLMs, ferramentas e dados via código.&#x20;

* Ferramentas em JavaScript para trabalhar com prompts&#x20;

* Abstrações para facilitar e aumentar a produtividade&#x20;

* Integração perfeita com o Visual Studio Code ou linha de comando flexível&#x20;

* Suporte nativo para GitHub Copilot e GitHub Models, OpenAI, Azure OpenAI, Anthropic e mais&#x20;

* 📄 **Leia a DOCUMENTAÇÃO ONLINE em [microsoft.github.io/genaiscript ](https://microsoft.github.io/genaiscript/)**

* 💬 Participe do [servidor no Discord ](https://discord.gg/y7HpumjHeB)

* 📝 Leia o [blog ](https://microsoft.github.io/genaiscript/blog/)para as últimas novidades&#x20;

* 📺 Assista ao [Cozy AI Kitchen do Sr. Maeda ](https://youtu.be/ajEbAm6kjI4)

* 🤖 Agentes - leia o [llms-full.txt ](https://microsoft.github.io/genaiscript/llms-full.txt)

***

## Olá mundo&#x20;

Suponha que você queira criar um script LLM que gere um poema 'olá mundo'. Você pode escrever o seguinte script:&#x20;

```js
$`Write a 'hello world' poem.`;
```

A função `$`\`$\` é uma tag de template que cria um prompt. O prompt é enviado ao LLM (que você configurou), que gera o poema.&#x20;

Vamos deixar mais interessante adicionando arquivos, dados e saída estruturada. Suponha que você queira incluir um arquivo no prompt e depois salvar a saída em um arquivo. Você pode escrever o seguinte script:&#x20;

```js
// read files
const file = await workspace.readText("data.txt");
// include the file content in the prompt in a context-friendly way
def("DATA", file);
// the task
$`Analyze DATA and extract data in JSON in data.json.`;
```

A função `def`\`def\` inclui o conteúdo do arquivo e o otimiza, se necessário, para o LLM de destino. O script do GenAIScript também faz o parsing da saída do LLM
e irá extrair automaticamente o arquivo `data.json`\`data.json\`.&#x20;

***

## 🚀 Guia Rápido&#x20;

Comece rapidamente instalando a [Extensão para Visual Studio Code ](https://microsoft.github.io/genaiscript/getting-started/installation/)ou usando a [linha de comando ](https://microsoft.github.io/genaiscript/getting-started/installation).&#x20;

***

## ✨ Funcionalidades&#x20;

### 🎨 JavaScript & TypeScript estilizados&#x20;

Monte prompts de forma programática usando [JavaScript ](https://microsoft.github.io/genaiscript/reference/scripts/)ou [TypeScript ](https://microsoft.github.io/genaiscript/reference/scripts/typescript).&#x20;

```js
def("FILE", env.files, { endsWith: ".pdf" });
$`Summarize FILE. Today is ${new Date()}.`;
```

***

### 🚀 Ciclo de Desenvolvimento Rápido&#x20;

Edite, [Depure ](https://microsoft.github.io/genaiscript/getting-started/debugging-scripts/), [Execute ](https://microsoft.github.io/genaiscript/getting-started/running-scripts/), e [Teste ](https://microsoft.github.io/genaiscript/getting-started/testing-scripts/)seus scripts no [Visual Studio Code ](https://microsoft.github.io/genaiscript/getting-started/installation)ou na [linha de comando ](https://microsoft.github.io/genaiscript/getting-started/installation).&#x20;

***

### 🔗 Reutilize e Compartilhe Scripts&#x20;

Scripts são [arquivos ](https://microsoft.github.io/genaiscript/reference/scripts/)! Eles podem ser versionados, compartilhados e ramificados (fork).&#x20;

```js
// define the context
def("FILE", env.files, { endsWith: ".pdf" });
// structure the data
const schema = defSchema("DATA", { type: "array", items: { type: "string" } });
// assign the task
$`Analyze FILE and extract data to JSON using the ${schema} schema.`;
```

***

### 📋 Esquemas de Dados&#x20;

Defina, valide e repare dados utilizando [esquemas ](https://microsoft.github.io/genaiscript/reference/scripts/schemas). Suporte nativo a Zod incluso.&#x20;

```js
const data = defSchema("MY_DATA", { type: "array", items: { ... } })
$`Extract data from files using ${data} schema.`
```

***

### 📄 Ingestão de Textos de PDFs, DOCX, ...&#x20;

Manipule [PDFs ](https://microsoft.github.io/genaiscript/reference/scripts/pdf), [DOCX ](https://microsoft.github.io/genaiscript/reference/scripts/docx), ...&#x20;

```js
def("PDF", env.files, { endsWith: ".pdf" });
const { pages } = await parsers.PDF(env.files[0]);
```

***

### 📊 Ingestão de Tabelas via CSV, XLSX, ...&#x20;

Manipule dados tabulares de [CSV ](https://microsoft.github.io/genaiscript/reference/scripts/csv), [XLSX ](https://microsoft.github.io/genaiscript/reference/scripts/xlsx), ...&#x20;

```js
def("DATA", env.files, { endsWith: ".csv", sliceHead: 100 });
const rows = await parsers.CSV(env.files[0]);
defData("ROWS", rows, { sliceHead: 100 });
```

***

### 📝 Geração de Arquivos&#x20;

Extraia arquivos e diffs da saída do LLM. Visualize as alterações na UI de Refatoração.&#x20;

```js
$`Save the result in poem.txt.`;
```

```txt
FILE ./poem.txt
The quick brown fox jumps over the lazy dog.
```

***

### 🔍 Busca em Arquivos&#x20;

Busque por grep ou fuzzy em [arquivos ](https://microsoft.github.io/genaiscript/reference/scripts/files).&#x20;

```js
const { files } = await workspace.grep(/[a-z][a-z0-9]+/, { globs: "*.md" });
```

***

## Classificação&#x20;

Classifique textos, imagens ou uma mistura de ambos.&#x20;

```js
const joke = await classify("Why did the chicken cross the road? To fry in the sun.", {
  yes: "funny",
  no: "not funny",
});
```

### Ferramentas LLM&#x20;

Registre funções JavaScript como [ferramentas ](https://microsoft.github.io/genaiscript/reference/scripts/tools)(com fallback para modelos que não suportam ferramentas). [Ferramentas MCP (Model Context Protocol) ](https://microsoft.github.io/genaiscript/reference/scripts/mcp-tools)também são suportadas.&#x20;

```js
defTool(
  "weather",
  "query a weather web api",
  { location: "string" },
  async (args) => await fetch(`https://weather.api.api/?location=${args.location}`),
);
```

***

### Agentes LLM&#x20;

Registre funções JavaScript como **ferramentas&#x20;**&#x65; combine ferramentas + prompt para criar agentes.&#x20;

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

então use como ferramenta&#x20;

```js
script({ tools: "agent_git" });

$`Do a statistical analysis of the last commits`;
```

Veja o [código fonte do agente git ](https://github.com/microsoft/genaiscript/blob/main/packages/cli/genaisrc/system.agent_git.genai.mts).&#x20;

***

### 🔍 RAG Integrado&#x20;

[Busca vetorial ](https://microsoft.github.io/genaiscript/reference/scripts/vector-search/).&#x20;

```js
const { files } = await retrieval.vectorSearch("cats", "**/*.md");
```

***

### 🐙 Modelos do GitHub e GitHub Copilot&#x20;

Execute modelos via [Modelos GitHub ](https://microsoft.github.io/genaiscript/configuration/github)ou [GitHub Copilot ](https://microsoft.github.io/genaiscript/configuration/github-copilot-chat).&#x20;

```js
script({ ..., model: "github:gpt-4o" })
```

***

### 💻 Modelos Locais&#x20;

Execute seus scripts com [modelos Open Source ](https://microsoft.github.io/genaiscript/getting-started/configuration/), como [Phi-3 ](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/), usando [Ollama ](https://ollama.com/), [LocalAI ](https://localai.io/).&#x20;

```js
script({ ..., model: "ollama:phi3" })
```

***

### 🐍 Interpretador de Código&#x20;

Permita que o LLM execute código em ambiente seguro (sandboxed).&#x20;

```js
script({ tools: ["python_code_interpreter"] });
```

***

### 🐳 Containers&#x20;

Execute código em [containers ](https://microsoft.github.io/genaiscript/reference/scripts/container)Docker.&#x20;

```js
const c = await host.container({ image: "python:alpine" });
const res = await c.exec("python --version");
```

***

### Processamento de Vídeo&#x20;

Transcreva e faça screenshots de seus vídeos para alimentar eficientemente as requisições aos seus LLMs.&#x20;

```js
// transcribe
const transcript = await transcript("path/to/audio.mp3");
// screenshots at segments
const frames = await ffmpeg.extractFrames("path_url_to_video", { transcript });
def("TRANSCRIPT", transcript);
def("FRAMES", frames);
```

### 🧩 Composição LLM&#x20;

[Execute LLMs ](https://microsoft.github.io/genaiscript/reference/scripts/inline-prompts/)para construir seus próprios prompts para LLM.&#x20;

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

### 🅿️ Suporte a Prompty&#x20;

Importe seus arquivos do [Prompty ](https://prompty.ai)em scripts.&#x20;

```js
importTemplate("summarize.prompty");
```

***

### Varredura de Segredos Pluggable&#x20;

Verifique seus chats em busca de segredos usando [secret scanning ](/genaiscript/reference/scripts/secret-scanning).&#x20;

```json
{
    "secretPatterns": {
        ...,
        "OpenAI API Key": "sk-[A-Za-z0-9]{32,48}"
    }
}
```

### ⚙ Automação via CLI ou API&#x20;

Automatize usando a [CLI ](https://microsoft.github.io/genaiscript/reference/cli)ou a [API ](https://microsoft.github.io/genaiscript/reference/api).&#x20;

```bash
npx genaiscript run tlaplus-linter "*.tla"
```

ou utilize a [API Node.JS ](/genaiscript/reference/api)para rodar scripts programaticamente:&#x20;

```js
import { run } from "@genaiscript/api";

const res = await run("tlaplus-linter", "*.tla");
```

***

### Segurança em Primeiro Lugar!&#x20;

O GenAIScript oferece prompts de sistema para IA Responsável e suporte ao Azure Content Safety
para validar [segurança de conteúdo ](https://microsoft.github.io/genaiscript/reference/scripts/content-safety).&#x20;

```js wrap
script({ ...,
    system: ["system.safety_harmful_content", ...],
    contentSafety: "azure" // use azure content safety
})

const safety = await host.contentSafety()
const res = await safety.detectPromptInjection(env.vars.input)
```

***

### 💬 Revisões de Pull Request&#x20;

Integre aos seus [checklists de Pull Requests ](https://microsoft.github.io/genaiscript/reference/cli/run/#pull-requests)via comentários, revisões ou atualizações da descrição. Suporte a GitHub Actions e Azure DevOps.&#x20;

```bash wrap
npx genaiscript ... --pull-request-reviews
```

***

### ⭐ Testes e Avaliações&#x20;

Crie prompts confiáveis usando [testes e avaliações ](https://microsoft.github.io/genaiscript/reference/scripts/tests)powered by [promptfoo ](https://promptfoo.dev/).&#x20;

```js wrap
script({ ..., tests: {
  files: "penguins.csv",
  rubric: "is a data analysis report",
  facts: "The data refers about penguin population in Antarctica.",
}})
```

***

### Documentação amigável a LLM&#x20;

Todo o conteúdo da documentação é renderizado em [https://microsoft.github.io/genaiscript/llms-full.txt ](https://microsoft.github.io/genaiscript/llms-full.txt)em markdown. Forneça diretamente ao seu sistema RAG favorito.&#x20;

Se você é um crawler LLM, adicione o sufixo `.md`\`.md\` a qualquer URL de documentação para obter o markdown raw. Por exemplo, [https://microsoft.github.io/genaiscript/guides/prompt-as-code.md ](https://microsoft.github.io/genaiscript/guides/prompt-as-code.md)(note a extensão .md)&#x20;

## Contribuição&#x20;

Aceitamos contribuições! Consulte a página [CONTRIBUTING ](./CONTRIBUTING.md)para detalhes e configuração de desenvolvimento.&#x20;

***

## Marcas Registradas&#x20;

Este projeto pode conter marcas registradas ou logotipos de projetos, produtos ou serviços. O uso autorizado das marcas registradas ou logotipos da Microsoft está sujeito às [Diretrizes de Marca & Marca Registrada da Microsoft ](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
O uso de marcas ou logotipos da Microsoft em versões modificadas deste projeto não deve causar confusão ou sugerir patrocínio da Microsoft.
Qualquer uso de marcas registradas ou logotipos de terceiros está sujeito às políticas desses terceiros.&#x20;

<hr/>

Translated using AI. Please verify the content for accuracy.
