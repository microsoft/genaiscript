const transcript = await transcribe("src/audio/helloworld.mp4")
console.log(transcript.srt)
console.log(transcript.vtt)
console.log(JSON.stringify(transcript, null, 2))
const segments = transcript.segments
def("TRANSCRIPT", transcript.srt, {
    language: "srt",
    ignoreEmpty: true,
})
const frames = await parsers.videoFrames("src/audio/helloworld.mp4", {
    timestamps: segments.map((s) => s.start),
})
defImages(frames)
$`Describe the video using the screenshots and the transcript.`
