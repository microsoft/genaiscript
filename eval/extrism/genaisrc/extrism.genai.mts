script({
    title: "Runs a extrism sample",
    system: ["system", "system.explanations", "system.python", "system.files"],
})

const samples = "python/exercises/practice"
const { sample = "anagram" } = env.vars

// create container
const container = await host.container({
    image: "python:3.11.1",
    networkEnabled: true,
})
//console.log(`container path: ${await container.containerPath}`)
console.log(`host path: ${await container.hostPath}`)

await container.exec("git clone https://github.com/exercism/python")
await container.exec("pip install --upgrade pip")
await container.exec("pip install -r requirements.txt --user", {
    cwd: "python",
})
await container.exec("pip install pytest --user", { cwd: "python" })
await container.disconnect()

// generate sample
const cwd = path.join(samples, sample)
const instructions = await container.readText(
    path.join(cwd, ".docs/instructions.md")
)
console.log(path.join(cwd, ".meta/config.json"))
const {
    blurb,
    testRunner,
    files: samplefiles,
} = JSON.parse(await container.readText(path.join(cwd, ".meta/config.json")))
console.log(`blurb: ${blurb}`)
const { test, solution, example } = samplefiles
const filename = path.join(cwd, solution[0])

$`

## Task 1:

Analyze INSTRUCTIONS and generate Python code that the requirements.

- use Python 3.11
- Use the TEMPLATE code as a starting point and update it to solve the problem. 
You mush not change the function signature.
- do NOT generate unit tests.
- you can only use built-in python libraries. pip packages are not allowed.

## Task 2:

Evaluate the generated code by running the unit tests.

- Use the test_code tool to run the unit tests against the generated code.

## Task 3:

If the tests fail, update the generated code in Task 1 and re-run the tests in Task 1.

`

def("INSTRUCTIONS", instructions, { language: "markdown" })
def("TEMPLATE", { filename }, { language: "python" })

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
        console.log(code)
        await container.writeText(filename, code)
        const res = await container.exec(
            `python3.11 -m pytest -o markers=task ${sample}_test.py`,
            { cwd }
        )
        console.log(YAML.stringify(res))
        return res
    }
)
