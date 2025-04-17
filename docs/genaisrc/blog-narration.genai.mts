script({
    title: "Blog Post Narrator",
    description: "Creates narrated summaries of blog posts",
    accept: ".mdx,.md",
    model: "large",
    system: ["system.annotations"],
})
const file = env.files[0]
if (!file) cancel("No file provided")

const { text: summary } = await runPrompt((_) => {
    _.def("CONTENT", file)
    _.$`Create a concise, engaging summary of this blog post that would work well as a narration.
    - Focus on the key points and main message
    - Use natural, conversational language
    - Keep it between 2-3 paragraphs
    - Avoid technical jargon unless essential`
})

// 3. Generate speech from the summary
const { filename } = await speak(summary, {
    voice: "verse", // Use a natural-sounding voice
    model: "openai:gpt-4o-mini-tts", // High quality speech model
    instructions: `Accent/Affect: Warm, refined, and gently instructive, reminiscent of a friendly art instructor.

Tone: Calm, encouraging, and articulate, clearly describing each step with patience.

Pacing: Slow and deliberate, pausing often to allow the listener to follow instructions comfortably.

Emotion: Cheerful, supportive, and pleasantly enthusiastic; convey genuine enjoyment and appreciation of art.

Pronunciation: Clearly articulate artistic terminology (e.g., "brushstrokes," "landscape," "palette") with gentle emphasis.

Personality Affect: Friendly and approachable with a hint of sophistication; speak confidently and reassuringly, guiding users through each painting step patiently and warmly.`,
})
if (!filename) cancel("failed to generate speech")
console.log(`audio file: ${filename}`)

// copy to assets
const targetName = path.basename(
    path.changeext(file.filename, path.extname(filename))
)
const target = path.join(`./docs/public/blog/narrations`, targetName)
console.log(`target file: ${target}`)
await workspace.copyFile(filename, target)
file.content = MD.updateFrontmatter(file.content, {
    narration: "/genaiscript/blog/narrations/" + targetName,
})
await workspace.writeFiles(file)
