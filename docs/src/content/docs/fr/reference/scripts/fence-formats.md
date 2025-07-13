---
title: Formats de clôture
sidebar:
  order: 90
description: Découvrez les différents formats de clôture pris en charge par
  GenAIScript pour un formatage optimal du texte d'entrée des LLM.
keywords: fence format, LLM input, markdown, xml, GenAIScript
hero:
  image:
    alt: 'An 8-bit style icon shows three overlapping geometric panels: one features
      angle brackets symbolizing XML, another displays a triple backtick and
      smiley for Markdown, and the last is a plain rectangle with a smiley for
      "none." Each panel is a different color, outlined simply, and there are no
      gradients or shadows. The composition is flat, balanced, and uses only
      five distinct corporate colors on a transparent or plain background at
      128x128 pixels.'
    file: ../../../reference/scripts/fence-formats.png

---

GenAIScript prend en charge différents types de formats de « clôture » lors du rendu de la fonction [def](../../../reference/reference/scripts/context/), car les LLM peuvent réagir différemment selon le format du texte d'entrée.
**Depuis la version 1.82.0, le format par défaut est l'utilisation des balises XML.**

* [Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)
* [OpenAI](https://platform.openai.com/docs/guides/prompt-engineering#tactic-use-delimiters-to-clearly-indicate-distinct-parts-of-the-input)
* [Google](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/structure-prompts)

L'appel `def` suivant générera une région clôturée avec une syntaxe différente :

* `xml`

```js
def("TEXT", ":)", { fenceFormat: "xml" })
```

```markdown
<TEXT>
:)
</TEXT>
```

* `markdown`

```js
def("TEXT", ":)", { fenceFormat: "markdown" })
```

```markdown
TEXT:
\`\`\`
:)
\`\`\`
```

* `none`

```js
def("TEXT", ":)", { fenceFormat: "none" })
```

```text
TEXT:
:)
```

## Référence à un def

Si vous utilisez le format `xml`, il est conseillé d'utiliser `<NOM>` lors de la référence à la variable `def`, ou d'utiliser la valeur retournée comme nom.

```js
const textName = def("TEXT", ":)", { fenceFormat: "xml" })
$`Summarize ${textName}` // Summarize <TEXT>
```

## Configuration

GenAIScript sélectionnera automatiquement un format en fonction du modèle. Cependant, vous pouvez écraser le format au niveau du script.

```js
script({ fenceFormat: "xml" })
```

ou au niveau de `def` :

```js
def("TEXT", ":)", { fenceFormat: "xml" })
```

ou via l'option `--fence-format` dans la CLI :

```sh
genaiscript run ... --fence-format xml
```
