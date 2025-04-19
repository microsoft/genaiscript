import { delay, uniq } from "genaiscript/runtime"

/**
 * In order to run this script, you will need the following:
 *
 * - ffmpeg installed on your system
 * - a valid (Azure) OpenAI API key with whister enabled -- or a local whisper server running
 * - the usual LLM configuration
 *
 * Invoke the cli with the following command:
 *
 * ```
 * genaiscript run ai-kitchen <videofile> --vars "guest=<guest name>" --vars "instructions=<additional instructions>"
 * ```
 */
script({
    files: "src/video/ai_kitchen.local.mp4",
    cache: "ai-kitchen",
    temperature: 1.1,
    responseType: "markdown",
    systemSafety: false,
    parameters: {
        guest: {
            type: "string",
            description: "guest name",
            default: "Kori Jalskoski",
        },
        instructions: {
            type: "string",
            description: "additional instructions for the model",
            default: "This episode is about embeddings",
        },
    },
})

const { files, vars } = env
const { guest, instructions } = vars
const videoFile = files[0]
if (!videoFile) throw new Error("No video file found")

const hashtags = [
    ".NET",
    "Azure",
    "Azure AI services",
    "Azure OpenAI Service",
    "Microsoft Copilot",
]

// get some shows description
const listPage = await host.browse(
    "https://learn.microsoft.com/en-us/shows/mr-maedas-cozy-ai-kitchen/",
    { incognito: true }
)
await delay(2000)
const hrefs = uniq(
    await listPage
        .locator(
            "a[href^='/en-us/shows/mr-maedas-cozy-ai-kitchen/']:not([href='/en-us/shows/mr-maedas-cozy-ai-kitchen/'])"
        )
        .all()
        .then((ps) => Promise.all(ps.map((p) => p.getAttribute("href"))))
        .then((ps) => ps.map((p) => "https://learn.microsoft.com" + p))
)
// load the first 10
const articles = []
for (const href of hrefs.slice(0, 8)) {
    await listPage.goto(href)
    console.debug(`scrapping ${href}`)
    const title = await listPage
        .locator('meta[property="og:title"]')
        .getAttribute("content")
    const description = await listPage
        .locator('meta[property="og:description"]')
        .getAttribute("content")
    if (title && description) articles.push({ title, description })
}

// speech to text
const transcript = await transcribe(videoFile, {
    model: "openai:whisper-1",
    cache: "ai-kitchen",
})
// screnshot images
const frames = await ffmpeg.extractFrames(videoFile, {
    sceneThreshold: 0.4,
    cache: "ai-kitchen",
})

// prompting
def("TRANSCRIPT", transcript.srt, { language: "srt" })
defImages(frames, { detail: "low" })

$`You are an expert YouTube creator for the "Mr. Maea's Cozy AI Kitchen" show (https://learn.microsoft.com/en-us/shows/mr-maedas-cozy-ai-kitchen/).
The topic of the show is generative AI and LLMs, centered around Microsoft technologies.

Your task is to analyze the video <TRANSCRIPT> and screenshot images (taken at some transcript segment).
Generate a title and description for the video on YouTube that maximizes engagement of viewers.

- The title should be catchy and relevant to the content. It always starts with "Mr. Maeda's Cozy AI Kitchen - " and ends with "with ${guest}".
- Use a text format compatible with the YouTube description format.
- extract a list of key moments in the video and add them to the description
- the description should involve the guest name (${guest}) and the topic of the video.
- generate a list of hashtags related to the video content and add them to the description. Examples are ${hashtags.join(", ")}.
- generate a list of recommended URLs to read more about the topic and add them to the description. If you do not find any, leave it empty.
- respond using markdown + frontmatter.
${instructions || ""}

### Example

\`\`\`markdown
# Mr. Maeda's Cozy AI Kitchen - <the video title>

<descriptive paragraph>

### Chapters

- [00:00] Key moment 1
- [01:00] Key moment 2
...

### Recommended resources

- [Link 1](<relevant url>)
- [Link 2](<relevant url>)

#hashtags #hashtags2 ... 
\`\`\`

## Previous shows

${articles.map((a) => `# ${a.title}\n\n${a.description}`).join("\n\n")}
`
