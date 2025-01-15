script({
    description: "Generate a description alt text for a video",
    accept: ".mp4,.webm",
    system: [
        "system.output_plaintext",
        "system.safety_jailbreak",
        "system.safety_harmful_content",
        "system.safety_validate_harmful_content",
    ],
    files: "src/audio/helloworld.mp4",
})

const file = env.files[0]
const transcript = await transcribe(file, { cache: "alt-text" }) // OpenAI whisper
const frames = await ffmpeg.extractFrames(file, {
    transcript,
}) // ffmpeg to extract frames

def("TRANSCRIPT", transcript?.srt, { ignoreEmpty: true }) // ignore silent videos
defImages(frames, { detail: "low" }) // low detail for better performance

$`You are an expert in assistive technology.
You will analyze the video and generate a description alt text for the video.

- The video is included as a set of <FRAMES> images and the <TRANSCRIPT>.
- Do not include alt text in the description.
- Keep it short but descriptive.
- Do not generate the [ character.`
