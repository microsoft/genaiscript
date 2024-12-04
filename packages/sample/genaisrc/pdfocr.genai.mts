script({
    files: "src/pdf/jacdac.pdf",
})

for (const file of env.files.filter((f) => f.filename.endsWith(".pdf"))) {
    // extract text and render pages as images
    const { pages, images } = await parsers.PDF(file, {
        renderAsImage: true,
    })
    console.log(`pages: ${pages.length}`)
    const ocrs: string[] = []

    for (let i = 0; i < pages.length; ++i) {
        const page = pages[i]
        const image = images[i]
        // todo: orientation

        // mix of text and vision
        const res = await runPrompt(
            (ctx) => {
                if (i > 0) ctx.def("PREVIOUS_PAGE", pages[i - 1])
                ctx.def("PAGE", page)
                if (i + 1 < pages.length) ctx.def("NEXT_PAGE", pages[i + 1])
                ctx.defImages(image, { autoCrop: true, greyscale: true })
                ctx.$`You are an expert in reading and extracting markdown from a PDF image stored in the attached images.

            Your task is to convert the attached image to markdown.

            - We used pdfjs-dist to extract the text of the current page in PAGE, the previous page in PREVIOUS_PAGE and the next page in NEXT_PAGE.
            - Generate markdown. Do NOT emit explanations.
            - Generate CSV tables for tables.         
            - For images, generate a short alt-text description.
        `
            },
            {
                model: "small",
                label: `page ${i + 1}`,
                cache: "pdf-ocr",
                system: [
                    "system",
                    "system.assistant",
                    "system.safety_jailbreak",
                    "system.safety_harmful_content",
                ],
            }
        )

        ocrs.push(parsers.unfence(res.text, "markdown") || res.error?.message)
    }

    await workspace.writeText(file.filename + ".md", ocrs.join("\n\n"))
}
