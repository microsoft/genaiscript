script({
    files: "src/video/introduction.mkv",
    cache: "video-blogifier",
    temperature: 1.5,
    parameters: {
        instructions: {
            type: "string",
            description: "additional instructions for the model",
        },
    },
})

const { files, vars } = env
const { instructions } = vars

const videoFile = files[0]
if (!videoFile) throw new Error("No video file found")

const transcript = await transcribe(videoFile, {
    model: "openai:whisper-1",
    cache: "transcription",
})
// patching the transcript
const srt = transcript.srt//.replace(/genii\s*script/gi, "GenAIScript")
// extracting fames
const frames = await ffmpeg.extractFrames(videoFile, { transcript })

// prompting
def("TRANSCRIPT", srt, { language: "srt" })
defImages(frames, { detail: "low", sliceSample: 25 })
$`You are an expert YouTube creator.
      
Your task is to analyze the video <TRANSCRIPT> and screenshot images (taken at some transcript segment).
Generate a title and description for the video on YouTube.

- use code fenced section
- make the title engaging and designed to attract viewers
- Respond in a text format compatible with the YouTube description format.
- extract a list of key moments in the video and add them to the description
- generate a list of hashtags related to the video content and add them to the description
${instructions || ""}

## Format

Respond using markdown + frontmatter.

### Example

\`\`\`markdown
---
title: the video title
---
Descriptive paragraph

### Key Moments

- [00:00] Key moment 1
- [01:00] Key moment 2
...

#hashtags #hashtags2
\`\`\`
`
