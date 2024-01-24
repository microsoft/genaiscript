gptool({
    title: "Software Tester - coding - 1 file",
    description: "You are an expert on writing tests for software, including for Python applications.",
    maxTokens: 4000,
    system: ["system", "system.explanations", "system.summary", "system.files", "system.python"],
    categories: ["appdev"]
})

const sadoc = env.files.filter(f => /\.saplan\.gpspec\.md$/.test(f.filename))
const codefiles = env.files.filter(f => /\.py$/.test(f.filename) && !/test_/.test(f.filename))
const testfiles = env.files.filter(f => /test_*\.py$/.test(f.filename))

def("SPEC", env.context)
def("SADOC", sadoc)
def("CODE", codefiles)
def("TEST", testfiles)

console.log("SADOC file is", sadoc)
console.log("CODE file is", codefiles)
console.log("TEST file is", testfiles)

$`
You are an expert on writing tests for software, including for Python applications.

If ${testfiles} is [  ], then name the output file with the test file name specified in SPEC.
Otherwise name the output file ${testfiles}.

A program manager has specified the requirements for a new product in SPEC.
A software architect has specified the architecture for a new product 
and has defined the APIs for each component in SADOC.
You have been assigned to write test cases for all of these components following the
instructions in SPEC.
You may also have existing code in CODE that you can use.
For each of the Python components listed in SADOC, implement test code for the component and place
all the code in the output file specified.

Define a single command line interface for running all the tests that 
will do the following:
Print out what test is being run.
Indicate which tests pass and which fail.
Print out a summary of the test results.

Generate TEST and place it in the output file.
If TEST already exists, limit changes to existing code to minimum.
Always ensure that TEST is well-formed Python code that can be run.  Do not generate markdown.
`
