gptool({ title: "generate diagrams", 
         description: "Given markdown files describing a project, mermaid diagrams showing workflow",
         maxTokens: 4000,
         model: "gpt-4-32k",
         categories: ["whitepaper"]  })

def("SOURCES", env.files.filter(f => f.filename.endsWith(".md")))

def("BASENAME", env.context.filename.replace(".gpspec.md",".diagrams.md"))

$`
You are an experienced technical writer and you have been given documents describing a project in SOURCES.
The documents describe tools and the application of the tools in a user workflow.
Based on the documents, you will create a new markdown file called BASENAME containing mermaid diagrams that
illustrate the application of the tools in the workflow including the inputs and outputs.
The diagrams should be appropriate for a whitepaper, blog post, or presentation describing the project.
If there is a choice, the orientation of the diagram reduce the amount of vertical space it occupies in a document.
Also ensure the the font sizes are appropriate for a presentation.
Generate as many diagrams as necessary to illustrate the components of the project and how they interact.
For each generated diagram, include a concise caption and a longer description of the diagram in the markdown.

If there is a section of SOURCES giving specific instructions for generating diagrams, follow those instructions.
`
