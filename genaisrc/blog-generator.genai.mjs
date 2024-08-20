script({
    description: "Generate a blog post for Dev.to from the documentation",
    tools: ["fs"],
    parameters: {
        topic: {
            type: "string",
            default: "a gentle introduction to genaiscript with a few pointers to the docs",
            description: "The topic and goal of the article"
        }
    }
})

const { topic } = env.vars
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const formattedDate = `${yyyy}-${mm}-${dd}`;
def("TOPIC", topic)

$`
# Task

Generate a blog post for the web site https://dev.to on the topic of using GenAIScript script 
to solve the task described in TOPIC.

The main purpose is to create a genaiscript prompt generation script.

# Writing style and instructions

- use a clear and engaging tone
- illustrate with code examples
- title should be click-bait
- do NOT generate cover_image
- the script will be execute by GenAIScript CLI
- the TypeScript API is defined in the file genaisrc/genaiscript.d.ts
- save the generated markdown to a new file under the docs/src/content/docs/blog folder.
- generate a single file for the blog post, do NOT generate other files
- examples of GenAIScript code are in folder packages/sample/src/**/*.genai.*js
- do NOT explain how to install GenAIScript or the GenAIScript CLI
- use emojis
- add date in front matter as 'date: ${formattedDate}'
- add author in front matter as 'author: genaiscript'

# GenAISCript Documentation

You can extract information from the following files:

- the documentation: docs/src/content/docs/**/*.md*
- the existing blog posts: docs/src/content/blog/**/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/

`
