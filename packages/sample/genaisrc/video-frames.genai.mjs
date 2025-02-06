script({
    tools: "video_extract_frames",
    files: "src/audio/helloworld.mp4",
    tests: {
        files: "src/audio/helloworld.mp4",
    },
})
const frames = await ffmpeg.extractFrames(env.files[0], { count: 10 })
defImages(frames)
$`Describe the images.`
