gptool({ title: "character-ideas", 
         description: "Given a framing for a story, a plot idea and a list of characters, develops the characters",
         output: ".chars.gpspec.md", 
         maxTokens: 4000,
         model: "gpt-4-32k",
         categories: ["fiction"]  })

def("SUMMARY", env.subtree)
def("CHARS", env.output)
def("FRAMING", env.files.filter(f => f.filename.endsWith("FictionAI.gpspec.md")))

$`
You are an experience writer of fiction and you have been given a framing for a short story, 
which is in FRAMING.

SUMMARY is a more fleshed out version of the framing 
with more details about the plot and a list of the main characters.

You will take every character in the list of characters in SUMMARY and generate
a more detailed description, including specific and imaginative details,
of the character in CHARS.  Take into account the stylistic and thematic elements
from FRAMING.

Describe each character in a subsection and the description of each character
should include the following subsections:
- The character's name and age
- A description of the character's appearance
- A description of the character's personality
- A description of the character's background and backstory
- A description of the character's goals, desires, strengths, and weaknesses
- A description of the character's arc and how the character will grow and change over the course of the story

You will also suggest 2-3 additional characters that are not in the plot idea
but who will bring balance and diversity to the story.  For each of these characters,
you will describe what they add to the story and how they will interact with the other characters..
You will also provide a description of the character in the same format as above.

`
