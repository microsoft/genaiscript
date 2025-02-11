script({
    model: "small",
    files: "src/pdf/makecode.pdf",
})

const { images } = await parsers.PDF(env.files[0], {
    renderAsImage: true,
    cache: false,
})
defImages(images, {
    maxWidth: 800,
    ignoreEmpty: true,
})
$`The image above shows the figures in the PDF file.
Summarize the presentation.`
