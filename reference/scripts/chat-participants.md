import { Code } from "@astrojs/starlight/components"
import scriptSource from "../../../../../../packages/sample/genaisrc/multi-turn.genai.mts?raw"

The `defChatParticipant` allows to register a function that can add new user messages in the chat sequence, ...or rewrite the entire message history.
This allows to create multi-turn chat, simulate a conversation with multiple participants or on-thy-fly prompt rewriting.

```js
let turn = 0
defChatParticipant((_, messages) => {
    if (++turn === 1) _.$`Are you sure?`
})
```

In the example above, the `defChatParticipant` function is used to register a function that will be called every time a new message is added to the chat.

The function receives two arguments: the first argument is the `Chat` object, and the second argument is the list of messages that have been added to the chat since the last call to the function.

```js
defChatParticipant(async (_, messages) => {
  const text = messages.at(-1).content as string
  ...
})
```

## Tracking turns

The participant will be called on every turn so it is important to keep track of the turns to avoid infinite loops.

```js
let turn = 0
defChatParticipant((_, messages) => {
    if (++turn === 1) _.$`Are you sure?`
})
```

## Rewriting messages

To rewrite the message history, return a new list of new messages. The array of messages can be modified in place as it is already a structural clone of the original message history.

```js
defChatParticipant((_, messages) => {
    messages.push({
        role: "user",
        content: "Make it better!",
    })
    return { messages }
})
```

## Example: QA generator

This script uses a multi-turn chat to generate questions, answers and validate the quality of the answers.

<Code code={scriptSource} wrap={true} lang="js" title="qa-gen.genai.mjs" />