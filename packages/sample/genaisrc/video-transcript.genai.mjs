const res = await transcribe("src/audio/helloworld.mp4")
const segments = res.segments
def("TRANSCRIPT", segments.map((s, i) => `${i + 1}: ${s.text}`).join("\n"), {
    ignoreEmpty: true,
})
const frames = await parsers.videoFrames("src/audio/helloworld.mp4", {
    timestamps: segments.map((s) => s.start),
})
defImages(frames)
$`Describe the video using the screenshots and the transcript segments. Explain visually.`
