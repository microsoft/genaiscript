---
title: "Creating Custom GenAIScript Plugins: Extending Script Functionality with
  User-Defined Commands and Integrations"
date: 2025-06-06
authors: genaiscript
draft: true
tags:
  - GenAIScript
  - Plugins
  - Scripting
  - Integration
  - Tutorial

---

# Creating Custom GenAIScript Plugins: Extending Script Functionality with User-Defined Commands and Integrations

Custom tools take your GenAIScript experience to 🚀 new heights! In this post, we'll walk line-by-line through a GenAIScript example where we build custom user commands and even tap into external APIs. By the end, you'll understand how to make GenAIScript scripts more interactive, extensible, and practical for your own needs.

> _For more info on any functions or options, check the [official GenAIScript documentation](https://microsoft.github.io/genaiscript/)._

---

## Annotating Script Purpose

```javascript
script({
    description: "Demonstrates custom plugin/command integration in GenAIScript."
})
```

- **`script({ ... })`**: This function provides metadata about the script. Setting the `description` helps anyone reading or maintaining your script understand its purpose at a glance.
- **Why?** While optional, this is a good habit to support discoverability and maintainability.

---

## Defining a Custom Plugin (Tool): `reverse_text`

```javascript
defTool(
    "reverse_text",
    "Reverses the input text string.",
    {
        type: "object",
        properties: {
            text: {
                type: "string",
                description: "The text to reverse."
            }
        },
        required: ["text"]
    },
    (args) => {
        return args.text.split("").reverse().join("");
    }
)
```

Let's break down how this tool works:

- **`defTool`**: This is a built-in function to register new reusable "tools" (or plugins). Each tool exposes a named function the script can call.

- **Arguments**:
  - **`"reverse_text"`**: The unique name you'll use to call this tool from your script.
  - **Description**: Brief text for autocompletion or documentation.
  - **JSON Schema Object**: Defines parameters for the tool. Here, we declare one property:
    - **`text`**: A `string` with a short description.
    - **Required parameters**: The `required` array ensures the `text` input is always provided.
  - **Function Implementation**: The last argument is the function itself. It:
    - Receives `args` (an object matching your schema).
    - Uses standard JavaScript to reverse the string: `split("")` breaks into characters, `reverse()` flips the array, `join("")` stitches the result.

- **Result**: This registers `reverse_text` as a tool you can call from anywhere in your GenAIScript!

---

## Integrating an External API: `fetch_joke`

```javascript
defTool(
    "fetch_joke",
    "Fetches a random joke from an external API (icanhazdadjoke.com)",
    {},
    async () => {
        const res = await fetch("https://icanhazdadjoke.com/", {
            headers: { "Accept": "application/json" }
        });
        if (!res.ok) return "API error";
        const data = await res.json();
        return data.joke || "No joke found.";
    }
)
```

This tool shows how to connect your scripts to external data — a common pattern for custom automation! Let's walk through the code:

- **Name & Description**: As before, we give it a name (`fetch_joke`) and a clear description.
- **Empty Schema**: `{}` means this command takes no parameters.
- **Async Implementation**:
  1. Uses the `fetch` API to call _https://icanhazdadjoke.com/_ (a public joke API!).
  2. Requests a response in JSON format by setting the `"Accept"` header.
  3. Checks for errors (`res.ok`).
  4. Extracts and returns the joke. If no joke or error, it falls back on a safe message.

- **Pattern**: You can use this method to talk to **any** HTTP API.

---

## Putting It All Together: Using Our Tools!

```javascript
$`
# Custom GenAIScript Plugins Demo

Let's try our custom commands:

1. Call the reverse_text tool with the string "GenAIScript".
2. Call the fetch_joke tool to get a random joke from the internet.
`
```

- **Template String (using `$`` ... ``)**: In GenAIScript, the `$`-template literal is how you describe prompts and actions you want the LLM to execute.
- **Markdown Content**: You can use Markdown formatting for clear and readable scripts.
- **Instruction List**: This instructs GenAIScript to:
  1. Call our `reverse_text` tool with `"GenAIScript"` as the input.
  2. Call our `fetch_joke` API tool for a fresh laugh 🤣.

---

## Why Use Custom Tools?

Custom tools allow you to:

- 🎛 Extend GenAIScript with your own programmable logic.
- 🌐 Integrate any web API quickly and easily.
- 🔗 Reuse common code for more maintainable scripts.

You can combine user-defined tools or external integrations seamlessly within any GenAIScript workflow.

---

## Next Steps

Ready for more? Explore:

- [Official GenAIScript docs – defTool reference](https://microsoft.github.io/genaiscript/manual/plugins/)
- Examples in [`packages/sample/src/`](https://github.com/microsoft/genaiscript/tree/main/packages/sample/src)
- Experiment with your own plugins — the sky’s the limit for creativity!

Happy scripting! 🎉

---