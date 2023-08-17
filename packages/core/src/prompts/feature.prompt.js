prompt({
    title: "Generate BDD scenarios (.feature)",
    description: "Generate a Gherkin feature file from the node and children.",
    output: ".feature",
    system: "system.concise",
    categories: ["feature"],
})

$`
You are an expert system designer that writes scenarios in a [Gherkin syntax](https://cucumber.io/docs/gherkin/reference/). Update the following FEATURE to match SUMMARY.
`

def("SUMMARY", env.subtree)

def("FEATURE", env.output)

$`
Respond with the new FEATURE. Limit changes to existing scenarios to minimum, but add new scenarios as needed. Generate plain Gherkin syntax, do not generate markdown.
`
