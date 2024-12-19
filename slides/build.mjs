#!/usr/bin/env zx
import "zx/globals"

if (await fs.exists("../docs/public/slides/"))
    await fs.rm("../docs/public/slides/", { recursive: true })

let summary = ['---', 'title: Slides', 'sidebar:', '  order: 100', 'description: Slides', '---', '']

const slides = await glob("./*slides*.md")
slides.sort()
for (const slide of slides) {
    console.log(slide)
    const name = slide.replace(/(-|_)?slides(-|_)?/g, "").replace(/\.md$/, "") || "default"

    summary.push(`- [${name}](https://microsoft.github.io/genaiscript/slides/${name}/)`)
    await $`slidev build ${slide} --base /genaiscript/slides/${name}/ --out ../docs/public/slides/${name}`
}

await fs.writeFile("../docs/src/content/docs/slides.md", summary.join("\n"))