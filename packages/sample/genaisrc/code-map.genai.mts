script({
  accept: ".md,.mdx,.ts",
});
const { output } = env;
// generate map
const { text: map } = await runPrompt(
  (ctx) => {
    const code = ctx.def("CODE", env.files);
    ctx.$`You are an expert cartographer, prompt genius and omniscient code developer.
    You will summarize the code in the files ${code} and generate a description of a physical map.
    The description will be used by a LLM to generate an image of the map.
    The map will be used to visualize the code and its structure.
    Be descriptive about the visual features of the map as you would for a real map.
    The model has a context window of 4096 tokens.
    Use names from the code symbols.
    `.role("system");
  },
  {
    label: "summarize code to map",
    model: "large",
  },
);
output.fence(map);
// generate image
const { image } = await generateImage(map, {
  model: "image",
  quality: "high",
  size: "portrait",
});
await output.image(image.filename);
