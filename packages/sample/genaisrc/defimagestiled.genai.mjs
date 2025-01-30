script({
    files: ["src/robots.jpg", "src/vision/*.jpg"],
})

defImages(env.files, { tiled: true, detail: "low", autoCrop: true })
$`describe the images in the tiled image`
