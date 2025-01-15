const info = await ffmpeg.probe("src/audio/helloworld.mp4")
console.log(JSON.stringify(info, null, 2))
const { duration, width, height } = info.streams[0]
console.log({ duration, width, height })

const frames = await ffmpeg.extractFrames("src/audio/helloworld.mp4")
console.log(frames.join("\n"))
const more = await ffmpeg.extractFrames(
    "https://github.com/microsoft/jacdac-docs/raw/refs/heads/main/static/videos/addbutton.webm"
)

const audio = await ffmpeg.extractAudio("src/audio/helloworld.mp4", {
    outputOptions: "-ar 16000",
})
console.log({ audio })

defImages(frames)
defImages(more)
$`Describe the images.`
