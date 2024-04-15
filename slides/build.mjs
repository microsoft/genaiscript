#!/usr/bin/env zx
import "zx/globals"

const slides = await glob("./*slides.md")
for (const slide of slides) {
    console.log(slide)
    const name = slide.replace(/(\.|-|_)?slides\.md$/, "") || "default"
    await $`npx slidev build --base /genaiscript/slides/${name}/ --out ../docs/public/slides/${name}`
}