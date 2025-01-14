script({
    tools: ["agent_video"],
    files: "src/audio/helloworld.mp4",
})

const file = env.files[0]
const { filename } = file

$`Describe the characteristics of the video ${filename} and analyze the video to summarize it.`
