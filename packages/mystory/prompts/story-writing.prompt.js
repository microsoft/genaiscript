prompt({ title: "story-writing", 
         description: "Given characters, a plot, and a framing, write a story",
         outputFolder: "aidiscovery",
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: ["system.multifile", "system.notes"],
         categories: ["fiction"]  })

def("SUMMARY", env.subtree)
def("FRAMING", env.links.filter(f => f.filename.endsWith("FictionAI.coarch.md")))
def("CHARS", env.links.filter(f => f.filename.endsWith(".chars.coarch.md")))
def("PLOTLINE", env.links.filter(f => f.filename.endsWith(".plotline.coarch.md")))

$`
You are an experience writer of fiction and you have been given an outline for a short story, in SUMMARY, 
a framing for a short story, which is in FRAMING, 
a description of the characters in CHARS, and a sequence of events in PLOTLINE.

Your goal is to make the story entertaining and interesting to read with
frequent elements of humor and surprise.
You should write concisely and include quirky and interesting details in the style of a Neal Stevenson novel.

Your goal is to write each of the chapters of the story in a separate  markdown file.  Each chapter should be 500-1000 words long.

Make sure that the writing is vivid and includes specific details that make the story come alive. Use dialogue and action to show, rather than tell, the story.  

You take each subsection in PLOTLINE and write a chapter of the story based on the description in PLOTLINE.
Name each file with a 3-6 word title that is a clever description of the chapter.

Make the story have emotional elements connected to the interaction between the father and daughter.
Avoid using predictable cliches and tropes.  Include surprising and unexpected elements
in the story that change the readers perspective.

Make the story memorable with funny, clever, and surprising elements.

Design the story such that the thematic goals in FRAMING are achieved.

`
