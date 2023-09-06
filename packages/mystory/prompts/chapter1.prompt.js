prompt({ title: "chapter1", 
         description: "Given characters, a plot, and a framing, write the first chapter",
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
You are an experienced writer of fiction
with many best-selling science fiction novels and you have been given an outline for a short story, in SUMMARY, 
a framing for a short story, which is in FRAMING, 
a description of the characters in CHARS, and a sequence of events in PLOTLINE.

Your goal is to make the story entertaining and interesting to read with
frequent elements of humor and surprise.
You should write concisely and include quirky and interesting details in the style of a Neal Stevenson novel.

Your goal is to write the first chapter of the story.  It should be 500-1000 words long.
It should introduce the characters and the setting, providing many concrete
details that make the reader feel that they are there in the story.

Use dialogue and action to show, rather than tell, the story.  
Base the story developments on things that are technically feasible and include some of the technical details in the story to make it more realistic.

Use the background information but add additional details related to the location, the other characters in the story, and the overall situation.

Ensure that the chapter ends with a cliffhanger that makes the reader want to read the next chapter.  Make the chapter dramatic and exciting so that the reader is drawn into the story quickly.

Give the chapter a 3-6 word title that is a clever description of the chapter.

Make the chapter introduce emotional elements connected to the interaction between the father and daughter.
Avoid using predictable cliches and tropes.  Include surprising and unexpected elements in the story that change the readers perspective.

Make the story memorable with funny, clever, and surprising elements.

Design the story such that the thematic goals in FRAMING are achieved.

At the end of the chapter, include a section called "Author's notes" that highlights how the chapter achieves the goals described here.

`
