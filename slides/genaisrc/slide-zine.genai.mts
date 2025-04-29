script({
    title: "Slide Ziner",
    temperature: 0.5,
    systemSafety: true,
    accept: ".md",
})
const { output } = env
const file = env.files[0]
const frontmatter = MD.frontmatter(file)
if (frontmatter.layout) cancel("layout already set")

// generate map
const { text: zine } = await runPrompt(
    (ctx) => {
        const slides = ctx.def("SLIDE", file)
        ctx.$`You are an expert zine cartoon artist, prompt genius, visionary slide deck designer and omniscient code developer.
    You will summarize the slides in ${slides} and generate a description of the changes as a zine.
    The slides using the sli.dev markdown format.
    The description will be used by a LLM to generate an image of the zine.
    The zine will be used as the slide image.
    Be descriptive about the visual features of the zine as you would for a zine.
    Use names from the code symbols. MINIMIZE THE USE OF TEXT, FAVOR GRAPHICS.
    Avoid studio ghibli style.
    The model has a context window of 4096 tokens. The output image is portrait, 1 page, 6 tiles.
    Generate all the pages of the zine in a single tiled image.
    Use black-and-white pen and ink style.
    NO RELIGIOUS REFERENCES.
    `.role("system")
    },
    {
        label: "summarize slide to zine",
        model: "openai:gpt-4o",
        temperature: 1,
    }
)
const { image } = await generateImage(
    `Your task is to generate a Zine with the following instruction. Minimize the use of text, favor graphics.
    Generate all the pages of the zine in a single tiled image.
    ${zine}`,
    {
        model: "openai:gpt-image-1",
        quality: "high",
        size: "portrait",
        outputFormat: "jpeg",
    }
)
if (!image) cancel("no image found")
await output.image(image, "zine")

const imageFilename = path.changeext(
    file.filename,
    path.extname(image.filename)
)
await workspace.copyFile(image.filename, imageFilename)
frontmatter.layout = "image-left"
frontmatter.image = `./pages/${path.basename(imageFilename)}`
file.content = MD.updateFrontmatter(file.content, frontmatter)
await workspace.writeFiles(file)
