import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

Ever wanted an easy way to create a summary and a spoken narration for your blog post?
This script helps you do that using AI, turning your blog content into both a text summary and a voice audio file.  
[See the source on GitHub.](https://github.com/microsoft/genaiscript/blob/main/docs/genaisrc/blog-narration.genai.mts)

## How the Script Works

Let's go through the script step by step, explaining what each part does.

```ts
script({
    title: "Blog Post Narrator",
    description: "Creates narrated summaries of blog posts",
    accept: ".mdx,.md",
    model: "large",
    system: ["system.annotations"],
    files: "docs/src/content/docs/blog/azure-ai-search.mdx",
    parameters: {
        force: false,
    },
})
```

- defines the script metadata: title, description, which file types it processes (`.mdx`, `.md`), and which AI model to use.
- `"files"` points to the sample blog post to be narrated.
- `"parameters"` set optional script flags.

```ts
const { force } = env.vars
const file = env.files[0]
if (!file) cancel("No file provided")
```

- reads input parameters from environment variables and files.
- If no file is provided, the script cancels immediately.

```ts
const targetName = path.basename(path.changeext(file.filename, ".mp3"))
const target = path.join(`./docs/public/blog`, targetName)
if (!force && (await workspace.stat(target))) {
    cancel(`File already exists: ${target}`)
}
```

- prepares the name and target location for the output `.mp3` audio file.
- If the file already exists and `force` is not set, the script cancels.

```ts
const examples = {
    dramatic: `Voice Affect: Low, hushed, and suspenseful; convey tension and intrigue....`,
    friendly: `Affect/personality: A cheerful guide...`, ...
}
```

- prepares various sample voice and narration styles as guidance for the model.

```ts
const {
    json: { summary, instructions, voice },
} = await runPrompt(
    (_) => {
        _.def("CONTENT", file)
        _.`You are a podcast writer.

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
            instructions: "voice description",
            voice: {
                required: true,
                type: "string",
                enum: [
                    "alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "ballad",
                ],
            },
            summary: "summary",
        },
    }
)
```

- Runs an AI-powered prompt to generate:
    - A summary of the blog post
    - A narration style description
    - A voice type (from OpenAI TTS voices)
- The prompt details every requirement for the AI model, including instructions and example outputs.

```ts
const { filename } = await speak(summary, {
    model: "openai:gpt-4o-mini-tts", // High quality speech model
    voice, // Use a natural-sounding voice
    instructions,
})
```

- Calls the `speak` function to generate an audio narration of the summary using the chosen voice type and narration style.

```ts
if (!filename) cancel("failed to generate speech")
console.log(`audio file: ${filename}`)
```

- If audio file generation fails, the script stops.
- Otherwise, logs the output audio file name.

## Imported Functions

This script uses helpers from `genaiscript/runtime`:

- `runPrompt` - sends prompts to the AI model and returns structured outputs.
- `speak` - generates audio narration from text and voice instructions.
- `workspace` - handles file operations safely.
- `host.exec` - runs shell commands (like `ffmpeg`) to process files.

You can [browse the runtime source here](https://github.com/microsoft/genaiscript/blob/main/packages/cli/src/runtime.ts).

## Summary

This script quickly turns any blog post into a summarized text and voice narration, ready to share as audio or video. Perfect for making your blog more accessible and engaging! 🎤📝