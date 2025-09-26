import { Code } from "@astrojs/starlight/components"
import scriptSource from "../../../../../../../samples/sample/genaisrc/multi-turn.genai.mts?raw";

La fonction `defChatParticipant` permet d'enregistrer une fonction qui peut ajouter de nouveaux messages d'utilisateur dans la séquence de chat, ...ou réécrire l'historique complet des messages. Cela permet de créer des chats multi-tours, de simuler une conversation avec plusieurs participants ou de réécrire des invites à la volée.

```js
let turn = 0
defChatParticipant((_, messages) => {
    if (++turn === 1) _.$`Are you sure?`
})
```

Dans l'exemple ci-dessus, la fonction `defChatParticipant` est utilisée pour enregistrer une fonction qui sera appelée à chaque fois qu'un nouveau message est ajouté au chat.

La fonction reçoit deux arguments : le premier argument est l'objet `Chat`, et le second argument est la liste des messages qui ont été ajoutés au chat depuis le dernier appel à la fonction.

```js
defChatParticipant(async (_, messages) => {
  const text = messages.at(-1).content as string
  ...
})
```

## Suivi des tours

Le participant sera appelé à chaque tour, il est donc important de suivre les tours pour éviter les boucles infinies.

```js
let turn = 0
defChatParticipant((_, messages) => {
    if (++turn === 1) _.$`Are you sure?`
})
```

## Réécrire les messages

Pour réécrire l'historique des messages, renvoyez une nouvelle liste de nouveaux messages. Le tableau des messages peut être modifié sur place car il s'agit déjà d'un clone structurel de l'historique des messages d'origine.

```js
defChatParticipant((_, messages) => {
    messages.push({
        role: "user",
        content: "Make it better!",
    })
    return { messages }
})
```

## Exemple : Générateur de questions-réponses

Ce script utilise un chat multi-tours pour générer des questions, des réponses et valider la qualité des réponses.

<Code code={scriptSource} wrap={true} lang="js" title="qa-gen.genai.mjs" />