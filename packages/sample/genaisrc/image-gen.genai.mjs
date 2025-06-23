const { output } = env;
for (const model of ["openai:dall-e-2", "openai:dall-e-3", "openai:gpt-image-1"]) {
  output.heading(3, `Model: ${model}`);
  const { image, revisedPrompt } = await generateImage(
    `a cute cat. only one. iconic, high details. 8-bit resolution.`,
    {
      maxWidth: 400,
      autoCrop: true,
      mime: "image/png",
      model,
      size: "square",
    },
  );
  await env.output.image(image.filename);
  output.fence(revisedPrompt);
}
