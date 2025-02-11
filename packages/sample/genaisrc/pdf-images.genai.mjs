script({
    model: "small",
    files: "src/pdf/makecode.pdf",
})

const { images } = await parsers.PDF(env.files[0], {
    renderAsImage: true,
})
defImages(images, {
    maxHeight: 768,
    ignoreEmpty: true,
})
$`The image above shows the figures in the PDF file.
Summarize the presentation.`
