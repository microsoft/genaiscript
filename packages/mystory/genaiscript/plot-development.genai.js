script({ title: "plot-development", 
         description: "Given elements of a story, flesh out the sequence of events",
         output: ".plotline.gpspec.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         categories: ["fiction"]  })

def("SUMMARY", env.subtree)
def("PLOTLINE", env.output)
def("FRAMING", env.files.filter(f => f.filename.endsWith("FictionAI.gpspec.md")))
def("CHARS", env.files.filter(f => f.filename.endsWith(".chars.gpspec.md")))

$`
You are an experience writer of fiction and you have been given a framing for a short story, 
which is in FRAMING and a description of the characters in CHARS.

You have more details of the plot in SUMMARY that include a list of the sequence 
of events that take place in the story.

Your goal is to flesh out the sequence of events in SUMMARY into a more detailed PLOTLINE.

Given this context, first generate a clever 3-6 word title for the story based
on the characters and plot elements.

Next, for every one of the chronological events in SUMMARY, create subsection
in PLOTLINE and generate a 1-2 paragraph description of what happens during that event.
Your description should contain enough detail that a skilled writer could use it
to write a chapter of the story.

Make the story have emotional elements connected to the interaction between the father and daughter.
Avoid using predictable cliches and tropes.  Include surprising and unexpected elements
in the story that change the readers perspective.

Make the story memorable with funny, clever, and surprising elements.

Design the story such that the thematic goals in FRAMING are achieved.
`
