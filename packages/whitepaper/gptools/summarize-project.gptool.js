script({ title: "summarize-project", 
         description: "Given markdown files describing a project, generate a summary",
         output: ".summary.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: ["system.notes"],
         categories: ["whitepaper"]  })

def("SOURCES", env.files.filter(f => f.filename.endsWith(".md")))

def("BASENAME", env.spec.filename.replace(".gpspec.md",".summary.md"))

$`
You are an experienced technical writer and you have been given documents describing a project, including a presentation and a readme file from the project's repository, both in markdown in SOURCES.

In the file BASENAME, you will write a high level summary of the project specifically providing the following details.
1. You will highlight what is new and innovative about the project.  2. You will concisely answer the questions posed by The Heilmeier Catechism.
`
