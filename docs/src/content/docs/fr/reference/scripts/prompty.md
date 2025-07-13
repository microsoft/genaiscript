---
title: Prompty
sidebar:
  order: 51
description: Découvrez le format de fichier .prompty pour les invites
  paramétrées et son intégration avec GenAIScript pour le script AI.
keywords: prompty, scripts, AI, parameterized prompts, automation
hero:
  image:
    alt: A small, simple 8-bit-style illustration of a computer monitor with a
      markdown file icon on its screen, surrounded by geometric shapes
      symbolizing parameter fields, a settings gear, and chat bubbles for an AI
      assistant, all in five flat corporate colors, arranged in a clean,
      minimalistic layout without any background or realistic details. No
      people, text, or shading appear in the image.
    file: ../../../reference/scripts/prompty.png

---

GenAIScript prend en charge l'exécution des fichiers [.prompty](https://prompty.ai/) en tant que scripts (avec certaines limitations) ou leur importation dans un script. Il fournit également un analyseur pour ces fichiers.

## Qu'est-ce que Prompty ?

[Prompty](https://prompty.ai/) est un format de fichier similaire au markdown pour stocker des invites paramétrées ainsi que des informations sur le modèle.

```markdown title="basic.prompty"
---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
model:
    api: chat
    configuration:
        type: azure_openai
        azure_deployment: gpt-4o
    parameters:
        max_tokens: 128
        temperature: 0.2
inputs:
    question:
        type: string
sample:
    "question": "Who is the most famous person in the world?"
---

system:
You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly.

user:
{{question}}

{{hint}}
```

Il existe deux manières d'utiliser les fichiers prompty avec GenAIScript :

* les exécuter directement via GenAIScript
* les importer dans un script à l'aide de `importTemplate`

## Exécution de .prompty avec GenAIScript

Vous pouvez exécuter un fichier `.prompty` à partir de la [cli](../../../reference/reference/cli/) ou de Visual Studio Code comme n'importe quel autre script `.genai.mjs`.

GenAIScript convertira le contenu du `.prompty` en script et l'exécutera. Il prend en charge la plupart des options de la section des métadonnées, mais ignore en grande partie la section de configuration du modèle.

Voici à quoi le fichier `basic.prompty` est compilé :

```js wrap title="basic.prompty.genai.mts"
script({
    model: "openai:gpt-4o",
    title: "Basic Prompt",
    description: "A basic prompt that uses the chat API to answer questions",
    parameters: {
        question: {
            type: "string",
            default: "Who is the most famous person in the world?",
        },
    },
    temperature: 0.2,
    maxTokens: 128,
})

writeText(
    `You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly.`,
    { role: "system" }
)
$`{{question}}

{{hint}}`.jinja(env.vars)
```

## Importation de .prompty

Vous pouvez également importer et rendre un fichier .prompty au moment de l'exécution tout en générant l'invite à l'aide de `importTemplate`.

```ts
importTemplate("basic.prompty", {
    question: "what is the capital of france?",
    hint: "starts with p",
})
```

Dans ce scénario, le fichier `.prompty` n'est pas exécuté comme un script mais importé comme un modèle. La fonction `importTemplate` rendra le modèle avec les paramètres fournis.

## Analyse de .prompty

Utilisez `parsers.prompty` pour analyser un fichier `.prompty`.

```ts
const doc = await parsers.prompty(file)
```

### Fonctionnalités prises en charge

* `name`, `description`, `temperature`, `max_tokens`, `top_p`, ...0
* `inputs` converti en `parameters`
* la valeur `sample` alimente la section `default` des paramètres
* `outputs` converti en `responseSchema`
* Moteur de modèle [Jinja2](https://www.npmjs.com/package/@huggingface/jinja)

### Limitations

* La configuration du modèle utilise le fichier `.env` de GenAIScript (voir [configuration](../../../reference/getting-started/configuration/)).
* les images ne sont pas encore supportées

### Extensions

Champs supplémentaires utilisés par GenAIScript :

* `files` pour spécifier un ou plusieurs fichiers pour peupler `env.files`
* `tests` pour spécifier un ou plusieurs tests
