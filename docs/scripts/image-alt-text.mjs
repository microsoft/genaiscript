import "zx/globals"

echo(`generating alt text for images`)
const images = await glob([
    "src/assets/*.{png,jpg,gif}",
    "src/content/**/*.{png,jpg,gif}",
])
for (const image of images) {
    const alt = image + ".txt"
    if (await fs.pathExists(alt)) continue
    await spinner(
        image,
        () =>
            $`node ../packages/cli/built/genaiscript.cjs run image-alt-text ${image}`
    )
}
