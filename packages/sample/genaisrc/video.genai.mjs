script({
    tools: "video_extract_frames",
})
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
    outputOptions: "-b:a 16k",
})
console.log({ audio })
const cached = await workspace.writeCached("src/audio/helloworld.mp4", {
    scope: "run",
})
const cached2 = await workspace.writeCached("src/audio/helloworld.mp4", {
    scope: "run",
})
console.log({ cached, cached2 })

const custom = await ffmpeg.run(
    "src/audio/helloworld.mp4",
    (cmd) => {
        cmd.noAudio()
        cmd.keepDisplayAspectRatio()
        cmd.autopad()
        cmd.size(`200x200`)
        return "out.mp4"
    },
    { cache: false, outputOptions: ["-vf", "hue=s=0", "-vf", "format=gray"] }
)
console.log({ custom })

defImages(frames)
defImages(more)
$`Describe the images.`
