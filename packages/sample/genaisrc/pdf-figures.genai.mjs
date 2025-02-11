script({
    files: "src/pdf/makecode.pdf",
})

const { data } = await parsers.PDF(env.files[0])

def("PDF", env.files[0])
defImages(
    data.flatMap(({ figures }) => figures || []),
    {
        detail: "low",
        ignoreEmpty: true,
    }
)
$`The image above shows the figures in the PDF file.
Describe all images in the PDF file.`
