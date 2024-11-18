script({
    files: "./src/pdf/jacdac.pdf",
})
console.log(env.files[0])
const { pages, images } = await parsers.PDF(env.files[0].filename, {
    renderAsImage: true,
})
console.log(`found ${pages.length} pages and ${images.length} images`)
