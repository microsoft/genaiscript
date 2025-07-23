# Example GenAI Markdown Script

This demonstrates that `.genai.md` files should now work with the "Run GenAIScript..." command.

```js
script({
    title: "Sample Markdown Script",
    description: "A simple script to test .genai.md functionality"
})

$`Write a brief explanation of what GenAI markdown scripts are.`
```

This file should now:
1. Be recognized as a GenAI script by the VSCode extension
2. Show the "Run GenAIScript..." button in the editor title bar
3. Allow the script to be executed when the button is clicked
4. Support debugging with the "Debug GenAIScript..." command