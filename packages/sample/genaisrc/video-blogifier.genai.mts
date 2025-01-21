script({
    files: "src/video/introduction.mkv",
})

const videoFile = env.files[0]
if (!videoFile) throw new Error("No video file found")

async function fetchTrendingKeywords() {
    const maxResults = 20
    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&maxResults=${20}&key=${process.env.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(await response.text())
    const data: any = await response.json()
    const keywords = data.items.flatMap((item) => item.snippet.tags || [])
    const res = Array.from(new Set(keywords))
    return res
}

// google trands
const trends = await fetchTrendingKeywords()

const transcript = await transcribe(videoFile, {
    model: "openai:whisper-1",
    cache: "transcription",
})
env.output.fence(transcript.srt, "srt")
const srt = transcript.srt.replace(/genii\s*script/gi, "GenAIScript")
const frames = await ffmpeg.extractFrames(videoFile, { transcript })


def("YOUTUBE_MOST_POPULAR_KEYWORDS", trends.join("\n"))
def("TRANSCRIPT", srt, { language: "srt" })
defImages(frames, { detail: "low", sliceSample: 25 })

$`You are an expert YouTube creator.
  
Your task is to analyze the video <TRANSCRIPT> and screenshot images (taken at some transcript segment).
Generate a title and description for the video on YouTube.

- use code fenced section
- make the title engaging and designed to attract viewers
- Respond in a text format compatible with the YouTube description format.
- extract a list of key moments in the video and add them to the description

## Example

\`\`\`title
the video title
\`\`\`

\`\`\`description
the video description
\`\`\`
`
