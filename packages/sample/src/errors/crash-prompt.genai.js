script({
    model: "ollama:phi3",
    title: "crash prompt"
})

$`This prompt will crash now...`
throw new Error("crash")