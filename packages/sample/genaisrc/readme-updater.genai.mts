script({
    tools: ["fs"],
})

def("README", { filename: "README.md" })
def("FEATURES", { filename: "docs/src/content/docs/index.mdx" })


$`You are an expert open source maintainer.

# Task 1

Analyze the README file of the project. Generate ideas to improve it, if any.

# Task 2

Update the README file of the project

- Enhance the content to make it attractive to users.
- Follow best practices for README files in open source projects.
- Document features listed in FEATURES file.
- inline snippets from samples and documentation to illustrate features. link to documentation
- Do NOT MODIFY the "Contributing" and "Trademarks" sections. THIS IS VERY VERY IMPORTANT.
- Do NOT generate any legal guideline.
- use emojis
- do not make changes if not necessary
- Avoid table of contents
- Do not inline installation instructions, link to online documentation

# Task 3

As an expert open source maintainer, evaluate the quality of the README file updates and provide feedback.
Update the generate file as needed.

# File information

- documentation: docs/src/content/docs/**/*.md*
- type definition: genaisrc/genaiscript.d.ts
- samples: packages/sample/genaisrc/*.genai.*s
- online documentation: https://microsoft.github.io/genaiscript/ . The routing is docs/src/content/docs/**/<route>.md* becomes https://microsoft.github.io/genaiscript/<route>.
- use links to online documentation
- github repository: https://github.com/microsoft/genaiscript
- the package.json contains helpful scripts, the project uses yarn and is codespace ready

`

defFileOutput("README.md")
