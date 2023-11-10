gptool({ title: "paraphrase-section", 
         description: "Given a section, paraphrase it.",
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: [],
         categories: ["whitepaper"]  })

const focusFileName = env.vars.focusdoc
const mainFileName = env.vars.maindoc
const outFileName = focusFileName?.replace(".md", ".para.md")
console.log("writing to " + outFileName)


def("MAINDOC", env.links.filter(f => f.filename.endsWith(mainFileName)))
def("FOCUSDOC", env.links.filter(f => f.filename.endsWith(focusFileName)))
def("PLAN", env.file)  

// def("OTHERSOURCES", env.links.filter(f => f.filename.endsWith(".md")))

$`
You are an experienced technical writer and you have been given documents describing a project.  The most important files are the PLAN files, that have important instructions for generating the contents of the document.  The PLAN documents contain instructions that should be followed with high priority.

When writing, use an active voice.  Instead of saying "are proposed" say "we propose". 
Don't refer to the original document by calling it "this document". 

You will paraphrase a section of a larger document that is in MAINDOC.  The section that you will paraphrase is in FOCUSDOC.  Structure your write in the following way: (1) Limit the length to 2 pages. (2) Summarize the most important points made in the section first.  (3) After the summary, provide 3 examples from the specific examples given in FOCUSDOC. For each example, write at least four sentences.  (4) Finally summarize possible mitigations mentioned.` 

$`Paraphrase FOCUSDOC and place the result in the file ${outFileName}.`

