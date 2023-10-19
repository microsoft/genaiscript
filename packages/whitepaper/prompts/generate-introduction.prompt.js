prompt({ title: "generate-introduction", 
         description: "Given files about a project and the goal of writing a white paper, write an introduction for the white paper",
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: [],
         categories: ["whitepaper"]  })

def("PLAN", env.file)      
def("SOURCES", env.links.filter(f => f.filename.endsWith(".md")))

const introFileName = env.file?.filename?.replace(".gpspec.md", ".intro.md")
const intro = env.links.find(lk => lk.filename === introFileName)

if (intro) {
    def("INTRO", intro)
}

$`
You are an experienced technical writer and you have been given documents describing a project.  The most important files are the PLAN files, that have important instructions for generating the contents of the document.  The PLAN documents contain instructions that should be followed with high priority.

The SOURCES documents contain additional information about the project, 
including a presentation and a readme file from the project's repository, and other files.

You will write INTRO, an introduction to the paper that captures the essential ideas in the project.  The introduction should start with focusing on a key problem that the project addresses.  It should describe the key ideas in the project and explain why they address the problem.  It should also include the goals of the projects and the latest experimental results.  The introduction should conclude with a list of important contributions. The introduction should be written for a general audience.  The introduction should at most 2 pages long and be compelling even for readers who are not experts in the field.
`

if (intro) 
    $`Update the following INTRO to based on PLAN and SOURCES. Limit changes to existing text to minimum.`
else
    $`Generate an introduction to match PLAN and SUMMARY. Save the generated text in the ${introFileName} file.`
