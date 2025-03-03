const { image, revisedPrompt } = await generateImage(
    `a cute cat. only one. photographic, high details. 4k resolution.`
)
env.output.image(image.filename)
env.output.fence(revisedPrompt)