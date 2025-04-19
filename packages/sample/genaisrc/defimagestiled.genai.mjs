script({
    files: ["src/robots.jpg", "src/images/*.jpg"],
    model: "vision"
})

defImages(env.files, { tiled: true, detail: "low", autoCrop: true })
$`describe the images in the tiled image`
