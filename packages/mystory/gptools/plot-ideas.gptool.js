gptool({ title: "plot-ideas", 
         description: "Given a framing for a story, suggests a plot for the story.",
         output: ".plots.gpspec.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         categories: ["fiction"]  })

def("SUMMARY", env.subtree)
def("PLAN", env.output)
def("PREVPLAN", env.files.filter(f => f.filename.endsWith(".plots.gpspec.md")))

$`
You are an experience writer of fiction and you have been given a framing for a short story, 
which is in SUMMARY.
You will generate PLAN.  If PREVPLAN exists, you will use it
as a starting point for PLAN.
You will suggest five different plots for the story.
The story should present challenges for the characters and they should face difficulties.
The story should be edgy and have a dark side.  It should be reflect modern life.
The story should have a protagonist and an antagonist.  The antagonist should be a person or a group of people
that create problems for the protagonist. The story should include 
mishaps for the protagonist and the protagonist should have to overcome obstacles.
The story should not fully resolve the conflict between the protagonist and antagonist.
The story should be targeted for a young adult and adult audience.

Each suggestion should be in a different markdown subsection.
Each plot suggestion should have a subsection in PLAN that describes the plot in 100-200 words.
Each suggestion should be a complete plot that includes a beginning, middle, and end.
Each suggestion should include in a subsection a list of each of the main characters,
including the protagonist and the antagonist.
Each suggestion should include in a subsection a list of the important locations where the story takes place.
Each suggestion should include a subsection with a list of chronological list of the events that take place in the story.
`
