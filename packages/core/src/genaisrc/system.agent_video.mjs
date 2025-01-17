system({
    description: "Agent that can work on video",
})

defAgent(
    "video",
    "Analyze and process video files or urls.",
    `Your are a helpful LLM agent that can analyze and process video or audio files or urls.
    You can transcribe the audio and/or extract screenshot image frames. Use 'vision_ask_images' 
    to answer questions about the video screenshots.

    Answer the question in <QUERY>.

    - make sure the filename is a valid video or audio file or url
    - analyze both the audio transcript and the video frames
    - if the video does not have audio, analyze the video frames
    `,
    {
        system: [
            "system",
            "system.tools",
            "system.explanations",
            "system.transcribe",
            "system.video",
            "system.vision_ask_images",
            "system.fs_find_files",
            "system.safety_harmful_content",
            "system.safety_protected_material",
        ],
    }
)
