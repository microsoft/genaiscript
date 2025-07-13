# Workflows

- Every LLM script starts simple...

```js
// map each file to its summary
for (const file of env.files) {
    // run 3.5 generate summary of a single file
    const { text } = await runPrompt(
        (_) => {
            _.def("FILE", file)
            _.$`Summarize FILE. Be concise.`
        },
        { model: "small", maxTokens: 12000 }
    )
    // save the summary in the main prompt
    // as a AI variable
    def("text", text)
}
// reduce all summaries to a single summary
$`Summarize <TEXT>.`
```
