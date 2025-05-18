const yt = await host.mcpServer({
    id: "youtube_transcript",
    command: "docker",
    args: ["run", "-i", "--rm", "mcp/youtube-transcript"],
})

const url = "https://youtu.be/ENunZe--7j0"
const transcript = await yt.callTool("get_transcript", { url })
console.log(`transcript: ${transcript.text}`)
