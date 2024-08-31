script({
    description: "Generate a blog post for Dev.to from the documentation",
    model: "openai:gpt-4-turbo",
    system: [],
    tools: ["fs", "md"],
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

- the documentation is in markdown and has frontmatter: docs/src/content/docs/**/*.md*
- the existing blog posts: docs/src/content/docs/blog/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/
`
        },
        {
            label: "generate topic",
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

// generate a working code snippet from topic
let snippet
{
    const { text, fences, error } = await runPrompt(
        (_) => {
            _.defTool(
                "genaiscript_typecheck",
                "Validates the syntax and type checks a GenAIScript source code",
                {
                    source: {
                        type: "string",
                        description: "The GenAIScript javascript source code",
                    },
                },
                async ({ source }) => {
                    // write file to a scratch folder
                    console.log(`checking source code`)
                    await workspace.writeText(
                        "temp/blog-post/script.genai.mjs",
                        source
                    )
                    return await host.exec("node", [
                        "packages/cli/built/genaiscript.cjs",
                        "scripts",
                        "compile",
                        "temp/blog-post",
                    ])
                }
            )

            _.def("TOPIC", topic)
            _.$`You are a JavaScript developer expert on GenAIScript (https://microsoft.github.io/genaiscript).

        # Task
        
        - Generate a GenAISCript source code that implements the idea described in TOPIC.
        - Validate syntax and checking with genaiscript_typecheck.
        - Respond ONLY with the JavaScript source code. Do NOT fence code in markdown. Do not add text around code.
        
        # Information
        
        Use these files to help you generate a topic for the blog post.
 
        - the code will be executed in node.js v20 by the GenAIScript CLI
        - the genaiscript type definition: genaisrc/genaiscript.d.ts. Assume that all globals are ambient. Do not import or require genaiscript module.
        - the genaiscript samples: packages/sample/src/*.genai.*
        - the documentation is in markdown and has frontmatter: docs/src/content/docs/**/*.md*
        - the online documentation: https://microsoft.github.io/genaiscript/
        `
        },
        {
            label: "generate script",
            system: [
                "system.tools",
                "system.fs_find_files",
                "system.fs_read_file",
            ],
            temperature: 0.5,
        }
    )
    if (error) throw error
    snippet =
        fences.find(
            ({ language }) => language === "js" || language === "javascript"
        ) ?? text
}

// generate a blog post
const today = new Date()
const yyyy = today.getFullYear()
const mm = String(today.getMonth() + 1).padStart(2, "0")
const dd = String(today.getDate()).padStart(2, "0")
const formattedDate = `${yyyy}-${mm}-${dd}`
def("TOPIC", topic)
def("SNIPPET", snippet)

$`
# Task

Generate a blog post that explains how to write the code in SNIPPET.

The main purpose is to create a genaiscript prompt generation script.
Respond with the markdown content of the blog post.

# Writing style and instructions

- generate the blog post content, nothing else
- use a clear and engaging tone
- explain each line of code separately, link to the documentation if possible
- title should be click-bait, use quotes (") around title. add title in frontmatter.
- do NOT generate cover_image
- the script will be execute by GenAIScript CLI
- the TypeScript API is defined in the file genaisrc/genaiscript.d.ts. Assume that all globals are ambient. Do not import or require genaiscript module.
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

- the documentation is in markdown and has frontmatter: docs/src/content/docs/**/*.md*
- the existing blog posts: docs/src/content/docs/blog/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/

`
defOutputProcessor((output) => {
    let md = output.text
    if (/\`\`\`markdown\n/.test(md)) {
        md = md.replace(/\`\`\`markdown\n/g, "").replace(/\`\`\`\n?$/g, "")
    }
    const fm = MD.frontmatter(md)
    if (!fm) throw new Error("No frontmatter found")

    md = MD.updateFrontmatter(md, {
        draft: true,
        date: formattedDate,
        authors: "genaiscript",
    })

    const fn =
        `docs/src/content/docs/blog/drafts/${fm.title.replace(/[^a-z0-9]+/gi, "-")}.md`.toLocaleLowerCase()
    const sn =
        `packages/sample/genaisrc/blog/${fm.title.replace(/[^a-z0-9]+/gi, "-")}.genai.mjs`.toLocaleLowerCase()
    return {
        files: {
            [fn]: md,
            [sn]: snippet,
        },
    }
})
