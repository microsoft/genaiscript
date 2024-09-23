script({
    title: "Describe objects in image",
    model: "gpt-4-turbo-v",
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
            files: "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/logo.png?raw=true",
            keywords: "yellow",
        },
    ],
})

$`Return the list of objects in the images.`
defImages(env.files, { detail: "low", maxWidth: 400, autoCrop: true })
