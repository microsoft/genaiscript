script({
    model: "small",
    files: "src/pdf/makecode.pdf",
})

const { file, data } = await parsers.PDF(env.files[0])
def("PDF", file)
defImages(
    data.flatMap(({ figures }) => figures || []),
    {
        detail: "low",
        ignoreEmpty: true,
    }
)
$`The image above shows the figures in the PDF file.
Describe all images in the PDF file.`
