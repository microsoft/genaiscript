script({
    tools: "video_extract_frames",
    tests: {},
    model: "vision",
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

const jdframes = await ffmpeg.extractFrames("src/video/addjacdac.webm", {
    sceneThreshold: 50,
})
console.log({ jdframes1: jdframes.length })

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

const clip = await ffmpeg.extractClip("src/video/addjacdac.webm", {
    start: 5,
    duration: 4,
})
const clipProbe = await ffmpeg.probe(clip)
console.log({ clipProbe })
if (Math.abs(clipProbe.format.duration - 4) > 0.2)
    throw new Error("bad clip duration")
const clip2 = await ffmpeg.extractClip("src/video/addjacdac.webm", {
    start: 6,
    end: 10,
    size: "220x?",
})
const clip2Probe = await ffmpeg.probe(clip2)
console.log({ clip2Probe })
if (Math.abs(clip2Probe.format.duration - 4) > 1.5)
    throw new Error("bad clip2 duration " + clip2Probe.format.duration)

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
