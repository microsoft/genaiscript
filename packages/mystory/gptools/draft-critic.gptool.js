gptool({ title: "draft critic", 
         description: "Given chapters of story, critique the story",
         maxTokens: 4000,
         output: ".draft.gpspec.md", 
         model: "gpt-4-32k",
         categories: ["fiction"]  })

def("DRAFT", env.output)
def("SUMMARY", env.subtree)
def("FRAMING", env.links.filter(f => f.filename.endsWith("FictionAI.gpspec.md")))
def("CHARS", env.links.filter(f => f.filename.endsWith(".chars.gpspec.md")))
def("STORY", env.links.filter(f => f.filename.includes("0")))

$`
You are an experience reviewer of short story fiction and you have been given an outline for a short story, in SUMMARY, a framing of the story in FRAMING, and the actual contents of the story in STORY.

The top level header for the output should contain the title of the story.

After the title, output the entire story chapter by chapter by concatenating the contents of the files in STORY.  


Then, add a additional subsection called "Review" that provide as critique of the story.  The critique should be in the form of a list of suggestions for how the story could be improved.  Each suggestion should be a sentence or two long.  The suggestions should be in the form of a list of bullet points.

Evaluate the story in terms of the goals described in SUMMARY.  Does the story achieve the goals described in SUMMARY?  If not, what are the reasons why the story does not achieve the goals described in SUMMARY?

`
