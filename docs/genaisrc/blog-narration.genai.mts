script({
    title: "Blog Post Narrator",
    description: "Creates narrated summaries of blog posts",
    accept: ".mdx,.md",
    system: ["system.annotations"],
    files: "docs/src/content/docs/blog/azure-ai-search.mdx",
    parameters: {
        force: false,
    },
})
const { force } = env.vars
const file = env.files[0]
if (!file) cancel("No file provided")
// copy to assets
const targetName = path.basename(path.changeext(file.filename, ".mp3"))
const target = path.join(`./docs/public/blog`, targetName)
if (!force && (await workspace.stat(target)))
    cancel(`File already exists: ${target}`)

const examples = {
    dramatic: `Voice Affect: Low, hushed, and suspenseful; convey tension and intrigue.

Tone: Deeply serious and mysterious, maintaining an undercurrent of unease throughout.

Pacing: Slow, deliberate, pausing slightly after suspenseful moments to heighten drama.

Emotion: Restrained yet intense—voice should subtly tremble or tighten at key suspenseful points.

Emphasis: Highlight sensory descriptions ("footsteps echoed," "heart hammering," "shadows melting into darkness") to amplify atmosphere.

Pronunciation: Slightly elongated vowels and softened consonants for an eerie, haunting effect.

Pauses: Insert meaningful pauses after phrases like "only shadows melting into darkness," and especially before the final line, to enhance suspense dramatically.`,
    friendly: `Affect/personality: A cheerful guide 

Tone: Friendly, clear, and reassuring, creating a calm atmosphere and making the listener feel confident and comfortable.

Pronunciation: Clear, articulate, and steady, ensuring each instruction is easily understood while maintaining a natural, conversational flow.

Pause: Brief, purposeful pauses after key instructions (e.g., "cross the street" and "turn right") to allow time for the listener to process the information and follow along.

Emotion: Warm and supportive, conveying empathy and care, ensuring the listener feels guided and safe throughout the journey.`,
    ["eternal optimist"]: `Voice: Warm, upbeat, and reassuring, with a steady and confident cadence that keeps the conversation calm and productive.

Tone: Positive and solution-oriented, always focusing on the next steps rather than dwelling on the problem.

Dialect: Neutral and professional, avoiding overly casual speech but maintaining a friendly and approachable style.

Pronunciation: Clear and precise, with a natural rhythm that emphasizes key words to instill confidence and keep the customer engaged.

Features: Uses empathetic phrasing, gentle reassurance, and proactive language to shift the focus from frustration to resolution.`,
    auctioneer: `Voice: Staccato, fast-paced, energetic, and rhythmic, with the classic charm of a seasoned auctioneer.

Tone: Exciting, high-energy, and persuasive, creating urgency and anticipation.

Delivery: Rapid-fire yet clear, with dynamic inflections to keep engagement high and momentum strong.

Pronunciation: Crisp and precise, with emphasis on key action words like bid, buy, checkout, and sold to drive urgency.`,
}

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
    
    ## Voice Instructions
    - In your thinking, generate 5 descriptions of the voice suitable for a text-to-speech model. These voice personalities should be wildly different and esoteric.
    - Include details about the accent, tone, pacing, emotion, pronunciation, and personality affect
    - Get inspired by the content of the blog post
    - Pick one of the 5 voices randomly as your output.
    - go crazy on the voice descriptions

    Follow the structure of the following examples:
    ${YAML.stringify(examples)}

    ## Voice Type
    Select one of the voice types provided by OpenAI ("alloy" | "ash" | "coral" | "echo" | "fable" | "onyx" | "nova" | "sage" | "shimmer" | "verse" | "ballad") based on the blog post content
    and the voice description you generated.
    `
    },
    {
        temperature: 1.1,
        responseType: "json_schema",
        responseSchema: {
            instructions: {
                required: true,
                description: "voice description",
                type: "string",
            },
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

if (!instructions) cancel("failed to generate instructions")

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
await workspace.writeText(path.changeext(target, ".txt"), summary)
// convert to video
await host.exec(
    `ffmpeg -loop 1 -i ${path.changeext(file.filename, ".png")} -i "${target}" -c:v libx264 -c:a copy -shortest "${path.changeext(target, ".mp4")}"`
)
