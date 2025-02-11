script({
    model: "small",
})

const images = await parsers.unzip(env.files[0], {
    glob: "*.jpg",
})
defImages(images, {
    maxHeight: 768,
    ignoreEmpty: true,
})
$`The image above shows the slides of a PowerPoint presentation.
Summarize the presentation.`
