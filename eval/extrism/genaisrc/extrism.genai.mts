script({
    title: "Runs a extrism sample",
    system: ["system", "system.explanations", "system.files"],
})

const samples = path.resolve("eval/extrism/python/exercises/practice")
const { sample = "anagram" } = env.vars

// generate sample
const cwd = path.join(samples, sample)
const main = path.join(cwd, sample + ".py")
const instructions = await workspace.readText(
    path.join(cwd, ".docs/instructions.md")
)
console.log(path.join(cwd, ".meta/config.json"))
const { blurb, testRunner, samplefiles } = await workspace.readJSON(
    path.join(cwd, ".meta/config.json")
)
const template = await workspace.readText(main)

$`You are an expert code.

You task is to generate python code that solves INSTRUCTIONS.

- Use the TEMPLATE code as a starting point and update it to solve the problem. 
You mush not change the function signature.
- Use the test_code tool to run the unit tests against your code.
`

def("INSTRUCTIONS", instructions, { language: "markdown" })
def("TEMPLATE", template, { language: "python" })

defTool(
    "test_code",
    "Run unit tests against generated solution",
    {
        code: {
            type: "string",
            description: "Generated Python code to solve the problem",
        },
    },
    async ({ code }) => {
        await workspace.writeText(main, code)
        return await host.exec(
            `python3.11 -m pytest -o markers=task {${sample}_test.py}`,
            { cwd }
        )
    }
)
