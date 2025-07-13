script({
  title: "Pull Request Visual Renderer",
  description:
    "Generate various visual representations of a pull request description from the git diff",
  temperature: 0.9,
  systemSafety: true,
  parameters: {
    base: {
      type: "string",
      description: "The base branch of the pull request",
    },
    maxTokens: {
      type: "number",
      description: "The maximum number of tokens to generate",
      default: 14000,
    },
  },
});
const { vars, output, dbg } = env;
const maxTokens = vars.maxTokens;
const defaultBranch = vars.base || (await git.defaultBranch());
const branch = await git.branch();
if (branch === defaultBranch) cancel("you are already on the default branch");

// compute diff
const changes = await git.diff({
  base: defaultBranch,
});
console.log(changes);
if (!changes) cancel("no changes found");

const nGenres = 7;
const { text: genres } = await prompt`## Task
    Think of 10 graphical/visual/artistic genres that can be used to tell stories or convey information.
    Pick ${nGenres} of them randomly
    ## Output
    Report one genre per line with a name and short description.

    \`\`\`example
    sketchnote, a visual note-taking technique that combines sketches and text to capture ideas and concepts in a concise and engaging manner.
    zine, a self-published, small-circulation book or magazine that often features a unique artistic style and personal perspective.
    \`\`\`
    `.options({ responseType: "text", systemSafety: false, model: "large" });

output.fence(`genres`, genres);

for (const genre of genres.split("\n").filter((s) => !!s)) {
  const [genreName, description = ""] = genre.split(",", 2);
  output.heading(2, genreName);
  output.item(description);
  // generate map
  const { text: imagePrompt } = await runPrompt(
    (ctx) => {
      const gd = ctx.def("GIT_DIFF", changes, {
        maxTokens,
        detectPromptInjection: "available",
      });
      ctx.$`You are an expert ${genreName} (${description}), prompt genius and omniscient code developer.
    You will summarize the code in the git diff ${gd} and generate a description of the changes as a ${genreName}.
    The description will be used by a LLM to generate an image of the ${genreName}.
    The ${genreName} will be used to tell "tell the story" of the changes.
    Be descriptive about the visual features of the ${genreName} as you would for a ${genreName}.
    Use names from the code symbols. MINIMIZE THE USE OF TEXT, FAVOR GRAPHICS.
    do NOT explain that GIT_DIFF displays changes in the codebase
    try to extract the intent of the changes, don't focus on the details
    Avoid studio ghibli style.
    The model has a context window of 4096 tokens. The output image is square.
    Generate a single page ${genreName}.
    `.role("system");
    },
    {
      label: `summarize code to ${genreName}`,
      model: "large",
    },
  );
  const { image } = await generateImage(
    `Your task is to generate a ${genreName} with the following instruction. 
        Minimize the use of text, favor graphics.
    ${imagePrompt}`,
    {
      model: "image",
      quality: "high",
      size: "square",
      outputFormat: "jpeg",
      maxWidth: 800,
    },
  );
  if (!image) cancel("no image found");
  const ghFile = await github.uploadAsset(image);
  await output.image(ghFile, genreName);
}
