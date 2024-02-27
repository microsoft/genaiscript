script({
    title: "describe-image",
    model: "gpt-4-turbo-v",
    system: [],
})

$`Return the list of objects in the images.`
defImages(env.files)
