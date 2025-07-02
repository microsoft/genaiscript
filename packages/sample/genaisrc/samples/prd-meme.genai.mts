script({
  title: "Pull Request Meme",
  description: "Generate a meme from a pull request description from the git diff",
  temperature: 0.8,
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

// generate map
const { text: zine } = await runPrompt(
  (ctx) => {
    const gd = ctx.def("GIT_DIFF", changes, {
      maxTokens,
      detectPromptInjection: "available",
    });
    ctx.$`You are an expert at meme (funny images), prompt genius and omniscient code developer.
    You will summarize the code in the git diff ${gd} and generate a description of the changes as a meme.
    The description will be used by a LLM to generate an image of the meme.
    The meme will be used to tell "tell the story" of the changes.
    Be descriptive about the visual features of the meme as you would for a meme.
    Use names from the code symbols.
    do NOT explain that GIT_DIFF displays changes in the codebase
    try to extract the intent of the changes, don't focus on the details
    The model has a context window of 4096 tokens. The output image is landscape.
    Generate a single page meme for all panels/pages.
    - avoid distracted boyfriend meme
    - avoid doge meme
    - avoid grumpy cat meme
    - avoid success kid meme
    - avoid bad luck brian meme
    - avoid troll face meme
    - avoid scumbag steve meme
    `.role("system");
  },
  {
    label: "summarize code to meme",
    model: "large",
  },
);
const { image } = await generateImage(
  `Your task is to generate a meme with the following instruction.
    ${zine}`,
  {
    model: "image",
    quality: "high",
    size: "landscape",
    outputFormat: "jpeg",
    maxWidth: 800,
  },
);
if (!image) cancel("no image found");
const ghFile = await github.uploadAsset(image);
await output.image(ghFile, "meme");
