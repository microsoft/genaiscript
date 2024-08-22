script({
    description: "Generate a blog post for Dev.to from the documentation",
    model: "openai:gpt-4o",
    tools: ["fs"],
    parameters: {
        theme: {
            type: "string",
            description: "The theme of the blog post",
        },
        topic: {
            type: "string",
            description: "The topic and goal of the article",
        },
    },
})
let { topic, theme } = env.vars

if (!topic) {
    // step 1 generate a topic
    const res = await runPrompt(
        (_) => {
            _.$`You are a blog writer expert on GenAIScript (https://microsoft.github.io/genaiscript).
# Task

Generate a blog post topic on the topic of writing and using a GenAIScript script.

${theme ? `- The theme of the blog post is ${theme}.` : ""}
- Avoid repeating a topic already covered in the blog
- do not generate outline, just the topic

# Information

Use these files to help you generate a topic for the blog post.

- the documentation: docs/src/content/docs/**/*.md*
- the existing blog posts: docs/src/content/docs/blog/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/
`
        },
        {
            model: "openai:gpt-4o",
            temperature: 1,
            system: [
                "system.tools",
                "system.fs_find_files",
                "system.fs_read_file",
            ],
        }
    )
    if (res.error) throw res.error
    topic = res.text
}

// generate a blog post
const today = new Date()
const yyyy = today.getFullYear()
const mm = String(today.getMonth() + 1).padStart(2, "0")
const dd = String(today.getDate()).padStart(2, "0")
const formattedDate = `${yyyy}-${mm}-${dd}`
def("TOPIC", topic)

$`
# Task

Generate a blog post for the web site https://dev.to on the topic of using GenAIScript script 
to solve the task described in TOPIC.

The main purpose is to create a genaiscript prompt generation script.

# Writing style and instructions

- generate the blog post content, nothing else
- save the generated markdown to a new file under the docs/src/content/docs/blog folder. THIS IS IMPORTANT
- use a clear and engaging tone
- illustrate with code examples
- title should be click-bait, use quotes (") around title
- do NOT generate cover_image
- the script will be execute by GenAIScript CLI
- the TypeScript API is defined in the file genaisrc/genaiscript.d.ts
- generate a single file for the blog post, do NOT generate other files
- examples of GenAIScript code are in folder packages/sample/src/**/*.genai.*js
- do NOT explain how to install GenAIScript or the GenAIScript CLI
- use emojis
- add date in front matter as 'date: ${formattedDate}'
- add authors in front matter as 'authors: genaiscript'
- do NOT generate <details> or <summary> tags
- add "draft: true" in the front matter
- add tags in frontmatter
- do not repeat topic

# GenAISCript Documentation

You can extract information from the following files:

- the documentation: docs/src/content/docs/**/*.md*
- the existing blog posts: docs/src/content/docs/blog/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/

`

defFileOutput("docs/src/content/docs/blog/*.md", "The generated blog post")
defOutputProcessor((output) => {
    if (!Object.keys(output.fileEdits || {}).length) {
        const fence = output.fences.find((f) => f.language === "markdown")
        if (fence) {
            const files = {
                [`docs/src/content/docs/blog/unnamed-${formattedDate}.md`]:
                    fence.content,
            }
            return { files }
        }
    }
})
