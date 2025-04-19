script({ parameters: { force: false }, accept: ".md,.mdx" })
const { force } = env.vars
const file = env.files[0]
const target = path.changeext(file.filename, ".png")
if (!force && (await workspace.stat(target)))
    cancel("hero image already exists")

const fm = MD.frontmatter(file.content)
// phase 1: generate image prompt
const style =
    "iconic, 2D, 8-bit, corporate, 5-color, simple, geometric, 128x128. no people, no text, flat design, minimalistic, no background, no shadows, no gradients, no reflections, no 3D elements, no depth, no perspective, no realism, no photography, no realism, no photorealism"
const { text: imagePrompt } = await runPrompt(
    (_) => {
        _.def("CONTENT", MD.content(file.content))
        _.$`Generate an image prompt for DALLE-3 that illustrates the contents of <CONTENT>.
Include specific description related to the content of <CONTENT>.        
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
        size: "1024x1024",
        scale: 1,
        maxHeight: 762,
        style: "vivid",
        autoCrop: true
    }
)

// phase 3: generate alt text
const { text: alt } = await prompt`
Generate an alt text description from <IMAGE_PROMPT>. 
Rephrase the prompt in a way that would be useful for someone who cannot see the image.
Do not start with "Alt Text:".

IMAGE_PROMPT:
${imagePrompt}`.options({
    responseType: "text",
    systemSafety: false,
    label: "alt-text",
})

// phase 4: patch frontmatter
fm.hero = {
    image: {
        alt,
        file: "./" + path.basename(target),
    },
}
await workspace.copyFile(image.image.filename, target)

file.content = MD.updateFrontmatter(file.content, fm)
await workspace.writeFiles(file)
