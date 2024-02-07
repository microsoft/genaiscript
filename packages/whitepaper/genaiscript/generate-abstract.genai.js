script({ title: "generate-abstract", 
         description: "Given files about a project and the goal of writing a white paper, write an abstract for the white paper",
         output: ".abstract.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: ["system.notes"],
         categories: ["whitepaper"]  })

def("SOURCES", env.files.filter(f => f.filename.endsWith(".md")))

$`
You are an experienced technical writer and you have been given documents describing a project, including a presentation and a readme file from the project's repository, all in markdown in SOURCES.

You will write a two paragraph abstract that captures the essential ideas in the project.  Make as strong a case as possible that this work will have widespread impact without using .The abstract should also include the goals of the projects and the latest experimental results.  The abstract should be written for a general audience.

Avoid overselling the ideas in the project.  Also, instead of provide general comments about how it can be used, provide specific details of scenarios to make the explanation concrete.
`