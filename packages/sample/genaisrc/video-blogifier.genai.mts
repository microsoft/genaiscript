script({
    files: "src/video/introduction.mkv",
    cache: "video-blogifier",
    tools: "agent",
    temperature: 1,
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

// speech to text
const transcript = await transcribe(videoFile, {
    model: "openai:whisper-1",
    cache: "transcription",
})
// screnshot images
const frames = await ffmpeg.extractFrames(videoFile, { sceneThreshold: 0.15 })
// prompting

def("TRANSCRIPT", transcript.srt.replace(/geni+\s*script/i, "GenAIScript"), { language: "srt" })
defImages(frames, { detail: "low" })
$`You are an expert YouTube creator.
      
Your task is to analyze the video <TRANSCRIPT> and screenshot images (taken at some transcript segment).
Generate a title and description for the video on YouTube that maximizes engagement on YouTube.

- Use a text format compatible with the YouTube description format.
- extract a list of key moments in the video and add them to the description
- generate a list of hashtags related to the video content and add them to the description
- respond using markdown + frontmatter.
- "geniscript" (or variants) should be "GenAIScript"
- Mention GenAIScript in the title
- Extract the list of topics discussed by the video and resolve 3 documentation links using the agent_doc.

${instructions || ""}

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

#hashtags #hashtags2 ... 
\`\`\`
`
