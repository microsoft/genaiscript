script({
    title: "describe-image",
    model: "gpt-4-turbo-v"
})

$`You are a helpful assistant. Describe each image.`
defImages(env.files)
