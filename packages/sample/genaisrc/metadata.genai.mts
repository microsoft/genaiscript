script({
    metadata: { name: "metadata", tool: "genaiscript" },
    temperature: 1,
})

$`Write a joke in emojis.`

await prompt`Write a joke in emojis.`.options({
    metadata: { inlined: "true" },
})
