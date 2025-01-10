script({
    accept: ".mp4,.webm",
    system: [
        "system.output_plaintext",
        "system.safety_jailbreak",
        "system.safety_harmful_content",
        "system.safety_validate_harmful_content",
    ],
})

const file = env.files[0]
const transcript = await transcribe(file) // OpenAI whisper
const frames = await parsers.videoFrames(file, {
    transcript,
}) // ffmpeg to extract frames
defImages(frames, { detail: "low" }) // low detail for better performance

$`
You are an expert in assistive technology. You will analyze the video and generate a description alt text for the video.

- The video is included as a set of FRAMES images and the TRANSCRIPT.
- Do not include alt text in the description.
- Keep it short but descriptive.
- Do not generate the [ character.`
