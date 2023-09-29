prompt({ title: "generate-introduction", 
         description: "Given files about a project and the goal of writing a white paper, write an introduction for the white paper",
         output: ".intro.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: ["system.notes"],
         categories: ["whitepaper"]  })

def("SOURCES", env.links.filter(f => f.filename.endsWith(".md")))

$`
You are an experienced technical writer and you have been given documents describing a project, including a presentation and a readme file from the project's repository, and other files, whose names are self-descriptive, all in markdown in SOURCES.

You will write an introduction to the paper that captures the essential ideas in the project.  The introduction should start with focusing on a key problem that the project addresses.  It should describe the key ideas in the project and explain why they address the problem.  It should also include the goals of the projects and the latest experimental results.  The introduction should be written for a general audience.  The introduction should about 1 page long and be compelling even for readers who are not experts in the field.
`