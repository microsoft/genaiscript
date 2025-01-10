const info = await parsers.videoProbe("src/audio/helloworld.mp4")
console.log(JSON.stringify(info, null, 2))
const { duration, width, height } = info.streams[0]
console.log({ duration, width, height })
const frames = await parsers.videoFrames("src/audio/helloworld.mp4")
console.log(frames)
defImages(frames)

const more = await parsers.videoFrames(
    "https://github.com/microsoft/jacdac-docs/raw/refs/heads/main/static/videos/addbutton.webm"
)
console.log(more)
defImages(more)

$`Describe the images.`
