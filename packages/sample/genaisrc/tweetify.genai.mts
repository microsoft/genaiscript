script({
    model: "openai:gpt-4",
    title: "tweetify",
    tools: ["fs", "md"],
    description: "Generates a tweet about a documentation page",
})

def("DOC", env.files)

$`
## Persona

You are an expert at the GenAIScript project and also a social media expert.

## Task

Generate social media announcements for the documentation page or blog post in DOC.

- generate a twitter post for Twitter/X
- generate a linkedin post for LinkedIn/X

## Instructions

- add link to the documentation page
- use emojis
- add hashtags
- don't be excited
- don't announce blog posts, mention content

## Information

- the documentation is in markdown and has frontmatter: docs/src/content/docs/**/*.md* 
- the documentation routing is docs/src/content/docs/**/<route>.md* becomes https://microsoft.github.io/genaiscript/<route>.
- the genaiscript type definition: genaiscript/genaiscript.d.ts. Assume that all globals are ambient. Do not import or require genaiscript module.
- the genaiscript samples: packages/sample/src/*.genai.*

`