import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

[Outils](../../reference/scripts/tools/) est une fonctionnalité puissante des modèles LLM qui permet d'augmenter le raisonnement des LLM avec des outils externes.

De nos jours, de nombreux modèles LLM intègrent un support intégré pour les outils. Cependant, certains ne le font pas... comme [o1-preview et o1-mini d'OpenAI](https://platform.openai.com/docs/guides/reasoning).

## Outils de secours

Avec GenAIScript 1.72.0, nous introduisons le concept des **outils de secours**. En gros, cela consiste en un [script système](../../reference/scripts/system#systemtool_calls/) qui "enseigne" au modèle LLM les outils disponibles et comment les utiliser.

```js wrap
$`## Tool support

You can call external tools to help generating the answer of the user questions.

- The list of tools is defined in TOOLS. Use the description to help you choose the best tools.
- Each tool has an id, description, and a JSON schema for the arguments.
...

\`\`\`tool_calls
<tool_id>: { <JSON_serialized_tool_call_arguments> }
<tool_id_2>: { <JSON_serialized_tool_call_arguments_2> }
...
\`\`\`
```

:::note
La performance de cette fonctionnalité variera considérablement en fonction du modèle LLM que vous décidez d'utiliser.
:::

## Un exemple d'outil

Voici un exemple d'un outil qui génère un nombre aléatoire compris entre 0 et 1.

```js
defTool("random", "Generate a random number", {}, () =>
  Math.random(),
);
$`Generate a random number between 0 and 1.`;
```

* trace o1-mini (utilisant les modèles GitHub)

````txt
prompting github:openai/o1-mini (~490 tokens)
```tool_calls
random: {}
```

prompting github:openai/o1-mini (~532 tokens)
Your random number between 0 and 1 is **0.7792901036554349**.
````

* modèle gemma2 (utilisant Ollama)

````txt
prompting ollama:gemma2 (~716 tokens)

```tool_calls
random: {}
```
prompting ollama:gemma2 (~758 tokens)

The random number is 0.9552638470626966.


Let me know if you'd like to generate another random number!
````

## Activation

Le mode outil de secours est automatiquement activé pour les modèles LLM connus qui ne prennent pas en charge les outils nativement. La liste n'est pas complète, alors ouvrez une issue si vous tombez sur un modèle qui devrait avoir les outils de secours activés.

Il peut être activé manuellement en réglant l'option `fallbackTools` sur `true` dans la configuration du script.

```js
script({
  fallbackTools: true,
});
```

ou en définissant l'option `--fallback-tools` dans la CLI.

```sh
genaiscript run --fallback-tools ...
```