script({
    title: "Pull Request Ziner",
    description:
        "Generate a zine from a pull request description from the git diff",
    temperature: 0.5,
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
})
const { vars, output, dbg } = env
const maxTokens = vars.maxTokens
const defaultBranch = vars.base || (await git.defaultBranch())
const branch = await git.branch()
if (branch === defaultBranch) cancel("you are already on the default branch")

// compute diff
const changes = await git.diff({
    base: defaultBranch,
})
console.log(changes)
if (!changes) cancel("no changes found")

// generate map
const { text: zine } = await runPrompt(
    (ctx) => {
        const gd = ctx.def("GIT_DIFF", changes, {
            maxTokens,
            detectPromptInjection: "available",
        })
        ctx.$`You are an expert zine cartoon artist, prompt genius and omniscient code developer.
    You will summarize the code in the git diff ${gd} and generate a description of the changes as a zine.
    The description will be used by a LLM to generate an image of the zine.
    The zine will be used to tell "tell the story" of the changes.
    Be descriptive about the visual features of the zine as you would for a zine.
    Use names from the code symbols. MINIMIZE THE USE OF TEXT, FAVOR GRAPHICS.
    do NOT explain that GIT_DIFF displays changes in the codebase
    try to extract the intent of the changes, don't focus on the details
    Avoid studio ghibli style.
    The model has a context window of 4096 tokens. The output image is landscape.
    Generate a single page zine for all panels/pages.
    `.role("system")
    },
    {
        label: "summarize code to zine",
        model: "large",
    }
)
const { image } = await generateImage(
    `Your task is to generate a Zine with the following instruction. Minimize the use of text, favor graphics.
    ${zine}`,
    {
        model: "image",
        quality: "high",
        size: "landscape",
        outputFormat: "jpeg",
        maxWidth: 800,
    }
) || {}
if (!image) cancel("no image found")
const ghFile = await github.uploadAsset(image)
await output.image(ghFile, "zine")
