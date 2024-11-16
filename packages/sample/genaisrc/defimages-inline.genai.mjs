script({
    files: "src/robots.jpg",
    model: "github:gpt-4o",
})
const res = await runPrompt((_) => {
    _.defImages(env.files)
    _.$`give keywords describing for each image`
})
