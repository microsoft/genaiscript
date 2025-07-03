script({
  files: [
    "https://githubnext.com/projects/continuous-ai/",
    "https://raw.githubusercontent.com/githubnext/awesome-continuous-ai/refs/heads/main/README.md",
  ],
});
const { files, output } = env;

// download and convert to markdown
const contents = await Promise.all(
  files.map((file) =>
    host.fetchText(file, {
      convert: "markdown",
    }),
  ),
);

// context engineering
const { text } = await runPrompt(
  (_) => {
    const refs = _.def(
      "CONTENT",
      contents.map((content) => content.file),
      { ignoreEmpty: true },
    );
    _.$`Your task is to generate 3 image slides from the content in ${refs}.

    Each slide should contain a title and a description based on the content provided. The slides should be formatted as a single paragraph that contains an image prompt that will be used to generate an image of the slide. The image generator is gpt-4o-mini.

    ## Instructions
    The slides should be formatted as a single paragraph that contains an image prompt that will be used to generate an image of the slide.
    The image generator is gpt-4o-mini.

    ## Visual style
    Use a cute cartoon style for the images, and make sure to include the following information in each slide: title, description.
    Use GitHub's branding colors and style. Use Oktocat.

    ## Output format
    Separate each paragraph with a line with three dashes (---).
    
    \`\`\`example
    this is the image prompt for the first slide
    ---
    this is the image prompt for the second slide
    ---
    this is the image prompt for the third slide
    \`\`\`
    
    
    `.role("system");
  },
  {
    model: "large",
    responseType: "text",
    cache: true,
    systemSafety: false,
  },
);

// parse out the slides
const slides = text.split(/^---\s*$/gm);

// generate images and stuff in markdown output
for (const slide of slides) {
  const { image } = await generateImage(slide);
  output.image(image);
}
