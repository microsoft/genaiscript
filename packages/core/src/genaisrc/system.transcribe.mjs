system({
    description: "Video transcription tool",
})

defTool(
    "transcribe",
    "Generate a transcript from a audio/video file using a speech-to-text model.",
    {
        filename: {
            type: "string",
            description: "Audio/video URL or workspace relative filepath",
        },
    },
    async (args) => {
        const { filename } = args
        if (!filename) return "No filename provided"
        const { text, srt } = await transcribe(filename, {
            cache: "transcribe",
        })
        return srt || text
    }
)
