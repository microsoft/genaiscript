Il est possible de fournir le début de la réponse du LLM (message `assistant`) dans le script.
Cela permet d’orienter la réponse du LLM vers une syntaxe ou un format spécifique.

Utilisez la fonction `assistant` pour fournir le texte de l’assistant.

```js
$`List 5 colors. Answer with a JSON array. Do not emit the enclosing markdown.`

// help the LLM by starting the JSON array syntax
// in the assistant response
assistant(`[`)
```

<details>
  <summary>👤 utilisateur</summary>

  ```markdown wrap
  List 5 colors. Answer with a JSON array. Do not emit the enclosing markdown.
  ```
</details>

<details open>
  <summary>🤖 assistant</summary>

  ```markdown wrap
  [
  ```
</details>

<details open>
  <summary>🤖 assistant</summary>

  ```markdown wrap
  "red",
  "blue",
  "green",
  "yellow",
  "purple"
  ]
  ```
</details>

:::caution
Cette fonctionnalité n’est **pas** prise en charge par tous les modèles.
:::

### Comment ça fonctionne ?

En interne, lors de l’invocation du LLM, un message supplémentaire est ajouté à la requête comme si le LLM avait généré ce contenu.

```json
{
  "messages": [
    ...,
    {
      "role": "assistant",
      "content": "[\n"
    }
  ]
}
```