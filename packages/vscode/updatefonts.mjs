import "zx/globals"
import svgtofont from "svgtofont"

async function generateFont() {
    try {
        console.log(`build font`)
        await svgtofont({
            src: path.resolve("./font"),
            dist: path.resolve("./built"),
            fontName: "genaiscript",
            startUnicode: 0xe000,
            css: false,
            website: null,
            svgicons2svgfont: {
                fontHeight: 1000,
                normalize: true,
            },
        })
        process.exit(0)
    } catch (e) {
        console.error("Font creation failed.", e)
        process.exit(-1)
    }
}

generateFont()
