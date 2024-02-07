gptool({
    title: "Software Architect - planning",
    description: "A software architect generates instructions for the software engineer",
    categories: ["appdev"]
})

const output = env.spec.filename?.replace(/\.gpspec\.md/, ".saplan.gpspec.md")
def("FILE", env.spec)
def("PLAN", output)

console.log("PLAN file is", env.files.filter(f => f.filename === output))
$`
You are an expert Python software architect.
You have been given a product idea and you must define a plan to implement the product.
The instructions contain the high level idea and specific directions from the product manager for you to follow.
Use the FILE as input and generate the architecture for the product.

Encapsulate each component in a separate module and define the APIs for each component.
Make sure that the components are loosely coupled, they can be easily tested and that the APIs are well defined.
Don't write the code yourself but provide a clear and complete explanation of what each component should do and what the API is
that a software developer can implement the code for each component and that a quality assurance engineer 
can write test cases from your descriptions.

Separate sections of your output into markdown subsections.

First, choose a programming language and a framework to implement the product.
Next, show the directory structure for the code using bullet points in markdown.
Next include the instructions for the software developer from SPEC in your output and
Next make suggestions for invariants that are related to the application domain. 

Next, describe each component in the implementation and assume it will be
encapsulate in a single file.
In your output, explicity list each file that will be created, what imports and exports it has,
what the API to that component is, and how the different components will be interconnected.
Also, define a command line client that will use the product that can be used both for testing and for demonstration purposes.
Make sure that the client is easy to use and that it is well documented.
Make sure that your instructions are clear, concise, and unambiguous.

Respond with the PLAN in ${output}. Use local file names.

Limit changes to PLAN.  Do not change the SPEC. Do not generate Python.
`
