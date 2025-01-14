script({
    tools: ["video_probe", "video_extract_audio", "video_extract_frames", "transcribe"],
    files: "src/audio/helloworld.mp4",
})

const file = env.files[0]
const { filename} = file

$`Describe the characteristics of the video ${filename} and analyze the video to summarize it.`