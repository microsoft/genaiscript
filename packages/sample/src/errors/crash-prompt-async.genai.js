script({
    title: "crash-prompt",
})

$`This prompt will crash now... ${async () => {
    throw new Error("crash")
}}`
