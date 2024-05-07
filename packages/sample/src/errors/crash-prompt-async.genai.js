script({
    model: "ollama:phi3",
    title: "crash prompt async",
})

$`This prompt will crash now... ${(async () => {
    throw new Error("crash")
})()}`
