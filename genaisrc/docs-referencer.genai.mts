script({
    title: "API reference documentation generator",
    description: "Generate reference documentation from a GenAISCript API type",
    parameters: {
        api: {
            type: "string",
            description: "The API to generate documentation for",
        },
    },
    tools: ["fs", "md"],
})

const api =
    env.vars.api || "the global variable 'git', implemented by the type 'Git'"
const doc = env.vars.route || "git.md"
const ref = "docs/src/content/docs/reference/scripts"
const docpath = path.join(ref, doc)

$`## Role 

Your are a technical writer for GenAIScript. You write clear and concise documentation for the GenAIScript API.

## Task

Generate or update a reference documentation for ${api}.

- update the existing documentation (EXISTING_DOC) if it exists with minimal changes

## Output

Generate markdown with a frontmatter compatible with @astro/starlight.

- save markdown in ${docpath}
- the frontmatter should contain the title, description

## Context

- the documentation is in markdown/MDX and has frontmatter: ${ref}/*.md*
- the online documentation: https://microsoft.github.io/genaiscript/
- API_TYPES contains the public TypeScript types for the GenAIScript API
`

def("EXISTING_DOC", { filename: docpath }, { ignoreEmpty: true })
def("API_TYPES", { filename: "genaisrc/genaiscript.d.ts" })
defFileOutput(docpath, "the generated documentation file")
