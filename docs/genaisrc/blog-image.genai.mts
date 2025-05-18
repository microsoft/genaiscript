script({ parameters: { force: false }, accept: ".md,.mdx" })
const file = env.files[0]
const target = path.changeext(file.filename, ".png")

const fm = MD.frontmatter(file.content)
if (env.vars.force || !(await workspace.stat(target))) {
    // phase 1: generate image prompt
    const style =
        "iconic, 2D, 8-bit, corporate, 5-color, simple, geometric, no people, no text"
    const { text: imagePrompt } = await runPrompt(
        (_) => {
            _.def("BLOG_POST", MD.content(file.content))
            _.$`Generate an image prompt for gpt-image-1 that illustrates the contents of <BLOG_POST>.
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
            size: "landscape",
            maxHeight: 762,
            model: "image",
        }
    )
    if (!image) cancel("image generation failed")

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
    fm.cover = {
        alt,
        image: "./" + path.basename(target),
    }
    await workspace.copyFile(image.image.filename, target)
}

if (env.vars.force || !fm.tags?.length) {
    const res = await prompt`
Generate 5 keyword tags from <BLOG_POST>. The tags are used for SEO purposes in a blog.
Respond with 1 tag per line.

<BLOG_POST>
${MD.content(file.content)}
</BLOG_POST>`.options({
        responseType: "text",
        systemSafety: false,
        label: "tags",
    })
    if (!res.error)
        fm.tags = res.text
            ?.split(/\r?\n/g)
            .map((tag) => tag.trim())
            .filter(Boolean)
}

if (!fm.excerpt) {
    const res = await prompt`
Generate an excerpt from <BLOG_POST>.
- Do not use "Excerpt", "Unlock", "Master".
- Maximize engagement on LinkedIn. Your tone is friendly and technical.
- Do not be excited.
- Do not add code snippets or sections.

<BLOG_POST>
${MD.content(file.content)}
</BLOG_POST>`.options({
        responseType: "text",
        systemSafety: false,
        label: "excerpt",
    })
    if (!res.error) fm.excerpt = res.text.trim()
}

// phase 5: save files
file.content = MD.updateFrontmatter(file.content, fm)
await workspace.writeFiles(file)
