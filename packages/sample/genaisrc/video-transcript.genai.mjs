script({
    files: "src/audio/helloworld.mp4",
})
const transcript = await transcribe(env.files[0], { cache: "demo" })
console.log(transcript)
def("TRANSCRIPT", transcript.srt, {
    language: "srt",
})
$`Summarize the video transcript.`
