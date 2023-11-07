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

def("FOCUSDOC", env.links.filter(f => f.filename.endsWith(focusFileName)))
def("MAINDOC", env.links.filter(f => f.filename.endsWith(mainFileName)))

def("PLAN", env.file)  

// def("OTHERSOURCES", env.links.filter(f => f.filename.endsWith(".md")))

$`
You are an experienced technical writer and you have been given documents describing a project.  The most important files are the PLAN files, that have important instructions for generating the contents of the document.  The PLAN documents contain instructions that should be followed with high priority.

You will paraphrase a section of a larger document that is in MAINDOC.  The section that you will paraphrase is in FOCUSDOC.` 

$`Paraphrase FOCUSDOC and place the result in ${outFileName} based on MAINDOC and FOCUSDOC. Limit changes to existing text to minimum.`

