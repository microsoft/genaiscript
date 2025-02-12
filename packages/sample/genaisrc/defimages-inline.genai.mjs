script({
    files: "src/robots.jpg",
    model: "vision",
})
const res = await runPrompt((_) => {
    _.defImages(env.files)
    _.$`give keywords describing for each image`
})
