script({
    description: "Generate a blog post for Dev.to from the documentation",
    tools: ["fs"],
    parameters: {
        topic: {
            type: "string",
            default: "how to write a script that lints an Azure Bicep file",
            description: "The topic and goal of the article"
        }
    }
})

const { topic } = env.vars

def("TOPIC", topic)

$`
# Task

Generate a blog post for the web site https://dev.to on the topic of TOPIC.

- use a clear and engaging tone
- illustrate with code examples
- do NOT generate cover_image
- save the generated markdown to a new file under the src/content/blog folder
- generate a single file for the blog post, do NOT generate other files

# GenAIScript syntax

- the TypeScript API is defined in the file genaisrc/genaiscript.d.ts

# Data sources

You can extract information from the following files:

- the documentation: src/content/docs/**/*.{md,mdx}
- the online documentation: https://microsoft.github.io/genaiscript/

`
