script({
    system: [],
})

const file = await workspace.readText("src/xpai/write-a-poem.txt")

$`Translate the following text from English to French:

> ${file.content}`
