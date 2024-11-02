script({
    model: "openai:gpt-4-turbo",
    tools: ["fs", "md"],
})

const api = env.vars.api + ""

$`You are an expert technical writer for the GenAIScript language.

## Task

Generate a documentation page about the ${api}.
Save to file in the docs/src/content/docs/reference/scripts folder.

## Information

- use markdown, with Astro Starlight syntax
- the genaiscript type definition: genaisrc/genaiscript.d.ts. Assume that all globals are ambient. Do not import or require genaiscript module.
- the documentation is in markdown and has frontmatter: docs/src/content/docs/**/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/
- the genaiscript samples: packages/sample/src/*.genai.*
- document each api separately with a short example
- use "js" language for genai code blocks
- link to online documentation for related apis
- use const keyword for all variables if possible
- do not add console.log to snippets
- minimize changes to existing documentation
`

defFileOutput("docs/src/content/docs/reference/scripts/*.md", "Documentation pages")