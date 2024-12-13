script({
    title: "Describe objects in image",
    model: "vision",
    group: "vision",
    maxTokens: 4000,
    system: [],
    files: [
        "src/robots.jpg",
        "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/logo.png?raw=true",
    ],
    tests: [
        {
            files: "src/robots.jpg",
            keywords: "robot",
        },
        {
            files: "https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/packages/sample/src/robots.jpg",
            keywords: "robot",
        },
    ],
})

$`Return the list of objects in the images.`
defImages(env.files, { detail: "low", maxWidth: 400, autoCrop: true })
