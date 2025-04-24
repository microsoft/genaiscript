const { image, revisedPrompt } = await generateImage(
    `a cute cat. only one. iconic, high details. 8-bit resolution.`,
    { maxWidth: 400, mime: "image/png", model: "openai:gpt-image-1" }
)
env.output.image(image.filename)
env.output.fence(revisedPrompt)
