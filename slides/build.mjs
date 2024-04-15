#!/usr/bin/env zx
import "zx/globals"

if (await fs.exists("../docs/public/slides/"))
    await fs.rm("../docs/public/slides/", { recursive: true })

let summary = ['# Slides', '']

const slides = await glob("./*slides.md")
for (const slide of slides) {
    console.log(slide)
    const txt = await fs.readFile(slide, "utf-8")
    const title = txt.match(/^title: (.*)$/m)[1]
    const name = slide.replace(/(\.|-|_)?slides\.md$/, "") || "default"

    summary.push(`- [${name}](/genaiscript/slides/${name}/), ${title}`)
    await $`npx slidev build --base /genaiscript/slides/${name}/ --out ../docs/public/slides/${name}`
}

await fs.writeFile("../docs/src/content/docs/slides.md", summary.join("\n"))