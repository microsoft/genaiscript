script({
    tools: ["transcribe"],
    files: "src/audio/helloworld.mp4",
})

const file = env.files[0]
$`Summarize the video ${file.filename}.`
