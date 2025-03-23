script({ parameters: { force: false } })
const file = env.files.find(({ filename }) => /\.mdx?$/.test(filename))
const target = path.changeext(file.filename, ".png")
if (!env.vars.force && (await workspace.stat(target)))
    cancel("blog image already exists")

// phase 1: generate image prompt
const style =
    "iconic, 2D, 8-bit, corporate, 5-color, simple, geometric, no people, no text"
const { text: imagePrompt } = await runPrompt(
    (_) => {
        _.def("BLOG_POST", MD.content(file.content))
        _.$`Generate an image prompt for DALLE-3 that illustrates the contents of <BLOG_POST>.
Include specific description related to the content of <BLOG_POST>.        
    ${style}`
    },
    { responseType: "text", systemSafety: false }
)

// phase 2: generate image
const image = await generateImage(
    `${imagePrompt}
    STYLE:
    ${style}`,
    {
        mime: "image/png",
        size: "1792x1024",
        scale: 768 / 1792,
        maxHeight: 762,
        style: "vivid",
    }
)

// phase 3: generate alt text
const { text: alt } = await prompt`
Generate an alt text description from <IMAGE_PROMPT>. 
Rephrase the prompt in a way that would be useful for someone who cannot see the image.
Do not start with "Alt Text:".

IMAGE_PROMPT:
${imagePrompt}`.options({ responseType: "text", systemSafety: false })

// phase 4: patch fronmatter
const fm = MD.frontmatter(file.content)
fm.cover = {
    alt,
    image: "./" + path.basename(target),
}
file.content = MD.updateFrontmatter(file.content, fm)

// phase 5: save files
await workspace.copyFile(image.image.filename, target)
await workspace.writeFiles(file)
