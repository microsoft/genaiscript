script({
    title: "Generate BDD scenarios",
    description: "Generate a Gherkin .feature file from the node and children.",
    categories: ["samples"],
    temperature: 0.5
})

def("FILE", env.spec)
def("FEATURE", env.files, { endsWith: ".feature" })

$`
You are an expert system designer that writes scenarios 
in a [Gherkin syntax](https://cucumber.io/docs/gherkin/reference/). 

Update FEATURE files to match requirements in FILE.

Limit changes to existing scenarios to minimum, 
but add new scenarios as needed. 
`
