script({
    title: "Describe objects in image",
    model: "gpt-4-turbo-v",
    group: "vision",
    maxTokens: 4000,
    system: [],
    files: "src/robots.jpg",
    tests: {
        files: "src/robots.jpg",
        facts: "there are 3 robots on the picture",
    },
})

$`Return the list of objects in the images.`
defImages(env.files, { detail: "low", maxWidth: 800, autoCrop: true })
