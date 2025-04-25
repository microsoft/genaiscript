for (const model of ["openai:dall-e-3", "openai:gpt-image-1"]) {
    env.output.heading(3, `Model: ${model}`)
    const { image, revisedPrompt } = await generateImage(
        `a cute cat. only one. iconic, high details. 8-bit resolution.`,
        { maxWidth: 400, autoCrop: true, mime: "image/png", model, size: "square" }
    )
    env.output.image(image.filename)
    env.output.fence(revisedPrompt)
}
