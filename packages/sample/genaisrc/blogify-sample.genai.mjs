script({
    files: "packages/sample/genaisrc/readme-updater.genai.mts",
    system: ["system.files"],
    tools: ["fs"],
    model: "openai:gpt-4",
    temperature: 0.8,
})

const today = new Date()
const yyyy = today.getFullYear()
const mm = String(today.getMonth() + 1).padStart(2, "0")
const dd = String(today.getDate()).padStart(2, "0")
const formattedDate = `${yyyy}-${mm}-${dd}`

def("FILE", env.files)
defFileOutput("docs/src/content/docs/blog/drafts/*.md", "generated blog posts")

$`Create a blog post that explains the GenAIScript source code in FILE.

- the title should be the intention of the script using simple words, keep it short, mention genai, wrap in quotes
- tell the motivation for the script.  Add a link to the script file using a GitHub URL.
- explain the script code line by line as if you were writing the script from scratch and telling a story.
- add a section that explains how to run the script with the genaiscript cli. Do not explain how to install the cli, link to the documentation instead.

# Format

- use a friendly technical blog tone, see https://dev.to/p/editor_guide
- Do not use <details> tag
- link to the github source URL if possible
- use a clear and engaging tone
- use emojis
- add authors in front matter as 'authors: genaiscript'
- do NOT generate <details> or <summary> tags
- add "draft: true" in the front matter
- add tags in frontmatter
- do not repeat topic
- set frontmatter date to ${formattedDate}
- avoid "genaiscript" in file title
- when inlining a large string in "$\`" with more than 10 lines, you can ellipse the end of the string with "..." if it is too long
- frontmatter tag should be an array
- do NOT repeat page title in markdown content
- save generate text to blog post drafts folder
- ignore existing blog posts
- avoid using "delve"
- include canonical_url to genaiscrip blog at https://microsoft.github.io/genaiscript/blog/<topic>
- use language "ts" for mts snippets and "js" for mjs snippets
- use markdown headers starting from level 2
- use lowercase characters, dashes for filenames
- when invoking the CLI, prefer using the script filename instead of the full path

# File information

- guides: docs/src/content/docs/guides/*.md*
- getting started: docs/src/content/docs/getting-started/*.md*
- reference documentation: docs/src/content/docs/reference/*.md*
- type definition: genaisrc/genaiscript.d.ts
- samples: packages/sample/genaisrc/*.genai.*s
- online documentation: https://microsoft.github.io/genaiscript/ . The routing is docs/src/content/docs/**/<route>.md* becomes https://microsoft.github.io/genaiscript/<route>.
- use links to online documentation
- github repository: https://github.com/microsoft/genaiscript . "main" is the default branch.

`
