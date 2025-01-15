system({
    description: "Video manipulation tools",
})

defTool(
    "video_probe",
    "Probe a video file and returns the metadata information",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename or URL to probe",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { context, filename } = args
        if (!filename) return "No filename or url provided"
        context.log(`probing ${filename}`)
        const info = await ffmpeg.probe(filename)
        return YAML.stringify(info)
    }
)

defTool(
    "video_extract_audio",
    "Extract audio from a video file into a .wav file. Returns the audio filename.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename or URL to probe",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { context, filename } = args
        if (!filename) return "No filename or url provided"
        context.log(`extracting audio from ${filename}`)
        const audioFile = await ffmpeg.extractAudio(filename)
        return audioFile
    }
)

defTool(
    "video_extract_frames",
    "Extract frames from a video file",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename or URL to probe",
            },
            count: {
                type: "number",
                description: "The number of frames to extract",
                default: -1,
            },
            timestamps: {
                type: "string",
                description: "A comma separated-list of timestamps.",
            },
            transcription: {
                type: "boolean",
                description: "Extract frames at each transcription segment",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { context, filename, transcription, timestamps, ...options } =
            args
        if (!filename) return "No filename or url provided"
        context.log(`extracting frames from ${filename}`)

        if (transcription) {
            options.transcription = await transcribe(filename, {
                cache: "transcribe",
            })
        }
        if (timestamps)
            options.timestamps = timestamps.split(",").filter((t) => !!t)
        const videoFrames = await ffmpeg.extractFrames(filename, options)
        return videoFrames.join("\n")
    }
)
