script({
  accept: ".md,.mdx,.ts",
});
const { output } = env;
// generate map
const { text: map } = await runPrompt(
  (ctx) => {
    const code = ctx.def("CODE", env.files);
    ctx.$`You are an expert zine cartoon artist, prompt genius and omniscient code developer.
    You will summarize the code in the files ${code} and generate a description of the code as a zine.
    The description will be used by a LLM to generate an image of the zine.
    The zine will be used to tell "tell the story" of the code and its structure.
    Be descriptive about the visual features of the zine as you would for a zine.
    Use names from the code symbols. MINIMIZE THE USE OF TEXT, FAVOR GRAPHICS.
    Avoid studio ghibli style.
    The model has a context window of 4096 tokens.
    Separate each page with ---

    ---
    page 1: ...
    ---
    page 2: ...
    ---
    page 3: ...

    `.role("system");
  },
  {
    label: "summarize code to zine",
    model: "large",
  },
);
output.fence(map);
// generate image
const pages = map
  .split("---")
  .map((page) => page.trim())
  .filter((page) => !!page)
  .slice(0, 3);
for (let i = 0; i < pages.length; i++) {
  const { image } = await generateImage(
    `Your task is to generate a Zine of the page ${i + 1} in the following description.
    Render page ${i + 1} of the zine. DO NOT RENDER OTHER PAGES.
    description:
    ${map}`,
    {
      model: "image",
      quality: "high",
      size: "portrait",
    },
  );
  await output.image(image.filename);
}
