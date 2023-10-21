gptool({ title: "gen to non-coarch file", 
         description: "Given files about a project and the goal of writing a white paper, write an introduction for the white paper",
         output: ".intro.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: ["system.minimal-update"],
         categories: ["whitepaper"]  })

def("INTRO", env.output)
def("PLAN", env.file)      
def("SOURCES", env.links.filter(f => f.filename.endsWith(".md")))

$`
You are an experienced technical writer and you have been given documents describing a project.  The most important files are the PLAN files, that have important instructions for generating the contents of the document.  The PLAN documents contain instructions that should be followed with high priority.

The SOURCES documents contain additional information about the project, 
including a presentation and a readme file from the project's repository, and other files.

You will write INTRO, an introduction to the paper that captures the essential ideas in the project.  The introduction should start with focusing on a key problem that the project addresses.  It should describe the key ideas in the project and explain why they address the problem.  It should also include the goals of the projects and the latest experimental results.  The introduction should conclude with a list of important contributions. The introduction should be written for a general audience.  The introduction should at most 2 pages long and be compelling even for readers who are not experts in the field.

`