system({
    description: "Agent that can work on video",
});
export default function (ctx) {
    var defAgent = ctx.defAgent;
    defAgent("video", "Analyze and process video files or urls.", "Your are a helpful LLM agent that can analyze and process video or audio files or urls.\n    You can transcribe the audio and/or extract screenshot image frames. Use 'vision_ask_images' \n    to answer questions about the video screenshots.\n\n    Answer the question in <QUERY>.\n\n    - make sure the filename is a valid video or audio file or url\n    - analyze both the audio transcript and the video frames\n    - if the video does not have audio, analyze the video frames\n    ", {
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
    });
}
