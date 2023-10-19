prompt({ title: "generate-outline", 
         description: "Given markdown files describing a project, generate an outline of a whitepaper",
         output: ".outline.gpspec.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: ["system.notes"],
         categories: ["whitepaper"]  })

def("SOURCES", env.links.filter(f => f.filename.endsWith(".md")))

$`
You are an experience technical writer and you have been given documents describing the project including a presentation and a readme file from a project's repository, both in markdown in SOURCES.

The goal is to write a 10-page technical white paper describing the innovative ideas and the technical details of the project.  The white paper will be written in markdown and will be published on the project's website.

Your immediate goal is to create an outline for the technical paper that indicates the major sections and subsections of the paper.  The outline should be written in markdown and should provide enough details that fleshing out the details of each section can be done by a junior technical writer.
`
