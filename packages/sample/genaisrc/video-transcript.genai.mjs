const transcript = await transcribe("src/audio/helloworld.mp4")
console.log(transcript.srt)
console.log(transcript.vtt)
console.log(JSON.stringify(transcript, null, 2))
def("TRANSCRIPT", transcript.srt, {
    language: "srt",
    ignoreEmpty: true,
})
const frames = await ffmpeg.extractFrames("src/audio/helloworld.mp4", {
    transcript,
})
defImages(frames)
$`Describe the video using the screenshots and the transcript.`
