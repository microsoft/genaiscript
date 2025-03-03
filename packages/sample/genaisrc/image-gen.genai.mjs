script({ model: "none" })
const image = await generateImage(`cute cats`, { model: "openai:dall-e-3" })
env.output.image(image.filename)
