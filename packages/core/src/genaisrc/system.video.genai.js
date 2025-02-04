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
                description: "The video filename to probe",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { context, filename } = args
        if (!filename) return "No filename provided"
        if (!(await workspace.stat(filename)))
            return `File ${filename} does not exist.`
        context.log(`probing ${filename}`)
        const info = await ffmpeg.probe(filename)
        return YAML.stringify(info)
    }
)

defTool(
    "video_extract_audio",
    "Extract audio from a video file into an audio file. Returns the audio filename.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename to probe",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { context, filename } = args
        if (!filename) return "No filename provided"
        if (!(await workspace.stat(filename)))
            return `File ${filename} does not exist.`
        context.log(`extracting audio from ${filename}`)
        const audioFile = await ffmpeg.extractAudio(filename)
        return audioFile
    }
)

defTool(
    "video_extract_clip",
    "Extract a clip from from a video file. Returns the video filename.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The video filename to probe",
            },
            start: {
                type: ["number", "string"],
                description: "The start time in seconds or HH:MM:SS",
            },
            duration: {
                type: ["number", "string"],
                description: "The duration in seconds",
            },
            end: {
                type: ["number", "string"],
                description: "The end time in seconds or HH:MM:SS",
            },
        },
        required: ["filename", "start"],
    },
    async (args) => {
        const { context, filename, start, end, duration } = args
        if (!filename) return "No filename provided"
        if (!(await workspace.stat(filename)))
            return `File ${filename} does not exist.`
        context.log(`extracting clip from ${filename}`)
        const audioFile = await ffmpeg.extractClip(filename, {
            start,
            end,
            duration,
        })
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
                description: "The video filename to probe",
            },
            keyframes: {
                type: "boolean",
                description: "Extract keyframes only",
            },
            sceneThreshold: {
                type: "number",
                description: "The scene threshold to use",
                default: 0.3,
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
        const { context, filename, transcription, ...options } = args
        if (!filename) return "No filename provided"
        if (!(await workspace.stat(filename)))
            return `File ${filename} does not exist.`
        context.log(`extracting frames from ${filename}`)

        if (transcription) {
            options.transcription = await transcribe(filename, {
                cache: "transcribe",
            })
        }
        if (typeof options.timestamps === "string")
            options.timestamps = options.timestamps
                .split(",")
                .filter((t) => !!t)
        const videoFrames = await ffmpeg.extractFrames(filename, options)
        return videoFrames.join("\n")
    }
)
