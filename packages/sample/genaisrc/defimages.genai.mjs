script({
    files: "src/robots.jpg",
    model: "vision",
})
defImages(env.files, { detail: "low", autoCrop: true })
$`give keywords describing for each image`
defImages(env.files, {
    autoCrop: true,
    greyscale: true,
    maxHeight: 1024,
    rotate: 90,
    scale: 0.9,
    crop: { x: 0, y: 0, w: 400, h: 400 },
    flip: { horizontal: true },
})
