script({
    title: "Blog Post Narrator",
    description: "Creates narrated summaries of blog posts",
    accept: ".mdx,.md",
    model: "large",
    system: ["system.annotations"],
    files: "docs/src/content/docs/blog/azure-ai-search.mdx",
})
const file = env.files[0]
if (!file) cancel("No file provided")
// copy to assets
const targetName = path.basename(path.changeext(file.filename, ".mp3"))
const target = path.join(`./docs/public/blog`, targetName)
if (await workspace.stat(target)) cancel(`File already exists: ${target}`)

const {
    json: { summary, instructions, voice },
} = await runPrompt(
    (_) => {
        _.def("CONTENT", file)
        _.$`You are a podcast writer.
    
    Your task is to create an engaging summary of this blog post that would work well as a narration
    AND a voice description for a text-to-speech model AND a voice type.

    ## Summary Instructions
    - Focus on the key points and main message
    - Use natural, conversational language
    - Keep it between 2-3 paragraphs
    - You can use Technical Jargon, but explain it in simple terms
    - Do not start with Excited
    
    ## Voice Description Instructions
    - In your thinking, generate 5 descriptions of the voice suitable for a text-to-speech model
    - Include details about the accent, tone, pacing, emotion, pronunciation, and personality affect
    - Get inspired by the content of the blog post
    - Pick one of the 5 voices randomly as your output.

    ## Voice Type Instructions
    Select one of the voice types provided by OpenAI based on the blog post content
    and the voice description you generated.
    `
    },
    {
        temperature: 1.1,
        responseSchema: {
            instructions: "voice description",
            voice: {
                required: true,
                type: "string",
                enum: [
                    "alloy",
                    "ash",
                    "coral",
                    "echo",
                    "fable",
                    "onyx",
                    "nova",
                    "sage",
                    "shimmer",
                    "verse",
                    "ballad",
                ],
            },
            summary: "summary",
        },
    }
)

// 3. Generate speech from the summary
const { filename } = await speak(summary, {
    model: "openai:gpt-4o-mini-tts", // High quality speech model
    voice, // Use a natural-sounding voice
    instructions,
})
if (!filename) cancel("failed to generate speech")
console.log(`audio file: ${filename}`)

console.log(`target file: ${target}`)
await workspace.copyFile(filename, target)
//file.content = MD.updateFrontmatter(file.content, {
//    narration: "/genaiscript/blog/" + targetName,
//})
//await workspace.writeFiles(file)
