GenAIScript provides various functions to get user input in a script
execution. This is useful to create "human-in-the-loop"
experience in your scripts.

When running the [CLI](/genaiscript/reference/cli),
the user input is done through the terminal.

## `host.confirm`

Asks a question to the user and waits for a yes/no answer. It returns a `boolean`.

```js
// true/false
const ok = await host.confirm("Do you want to continue?")
```

## `host.input`

Asks a question to the user and waits for a text input. It returns a `string`.

```js
const name = await host.input("What is your name?")
```

## `host.select`

Asks a question to the user and waits for a selection from a list of options.
It returns a `string`.

```js
const choice = await host.select("Choose an option:", [
    "Option 1",
    "Option 2",
    "Option 3",
])
```

## Continuous Integration

User input functions return `undefined`
when running in CI environments.