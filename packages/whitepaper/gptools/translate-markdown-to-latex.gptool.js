script({ title: "translate-markdown-to-latex", 
         description: "Given markdown files describing a project, generate a latex version",
         maxTokens: 4000,
         model: "gpt-4-32k",
         system: ["system.notes"],
         categories: ["whitepaper"]  })

def("SOURCES", env.files.filter(f => f.filename.endsWith(".md")))
def("PREVIOUS", env.files.filter(f => f.filename.endsWith(".tex")))

var basename = env.spec.filename.replace(".gpspec.md",".tex")

def("BASENAME", env.spec.filename.replace(".gpspec.md",".tex"))

console.log("BASENAME", basename)

$`
You are an professor with experience writing technical papers using LaTeX. You have been given documents describing a project written markdown in SOURCES.

Translate the content of the markdown files into a LaTeX document.  If there are mermaid diagrams in the markdown files, translate them into LaTeX diagrams.  Assume formatting and header information for the latex is already present in the file and only generate the content for the sections of the document.

Be sure to write the output to the file BASENAME.  If the file already exists in PREVIOUS, make minimal changes to it to update it with the new content.
`
