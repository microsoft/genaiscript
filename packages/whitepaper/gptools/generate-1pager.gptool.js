gptool({ title: "generate 1 pager", 
         description: "Given markdown files describing a project, generate 1 page overview",
         output: ".1pager.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         categories: ["whitepaper"]  })

def("SOURCES", env.files.filter(f => f.filename.endsWith(".md")))

def("BASENAME", env.context.filename.replace(".gpspec.md",".1pager.md"))

$`
You are an experienced technical writer and you have been given documents describing a project in SOURCES.

You will create a new file called BASENAME that will be a 1 page overview of the project.  

You will focus on the most important concepts in the project in the first part of the document.

In the 2nd part of the document you will concisely answer the questions about the project posed by The Heilmeier Catechism.
`
