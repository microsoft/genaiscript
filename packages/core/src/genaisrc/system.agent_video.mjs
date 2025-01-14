system({
    description: "Agent that can work on video",
})

defAgent(
    "video",
    "Analyze and process video files or urls.",
    `Your are a helpful LLM agent that can analyze and process video or audio files or urls.
    Answer the question in <QUERY>.`,
    {
        system: [
            "system",
            "system.tools",
            "system.explanations",
            "system.transcribe",
            "system.video",
            "system.safety_harmful_content",
            "system.safety_protected_material",
        ],
    }
)
