// metadata (including model parameters)
script({ title: "generate-doc-feature-guide",
         group: "doc tools", 
})

// use def to emit LLM variables
def("EXAMPLEGUIDES", env.files, { endsWith: "guide.md" })
def("EXAMPLEFEATURES", env.files, { endsWith: "feature.md" })
// def("NEWFEATURE", env.files, { endsWith: "new.md" })

def("NEWFEATURE", env.files, { endsWith: "new.md" })

// use $ to output formatted text to the prompt
$`You are a technical writer and software documentation expert.
You are given examples of documentation for different 
system features in EXAMPLES.  There is a new feature 
in the same system documented in NEWFEATURE.  Write a
user guide similar to those in EXAMPLES for the new feature.
Make sure the example illustrates the feature with minimal
extra complexity.
Write the output in .mdx format.
`        
