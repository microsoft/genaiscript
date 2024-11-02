script({
    model: "openai:gpt-4o",
    title: "Runs a extrism sample",
})

const results = `eval/extrism/results/${new Date().toISOString().replace(/:/g, "-")}`
const practiceDir = "python/exercises/practice"

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

const q = host.promiseQueue(5)
const samples = (await container.exec("ls -1", { cwd: practiceDir })).stdout
    .trim()
    .split(/\n/g)
await q.mapAll(samples, async (sample) => {
    const cwd = path.join(practiceDir, sample)
    console.log(cwd)
    const { files: samplefiles } = JSON.parse(
        await container.readText(path.join(cwd, ".meta/config.json"))
    )
    const { solution, test } = samplefiles
    const filename = path.join(cwd, solution[0])
    let instructions = ""
    for (const introname of [
        "introduction",
        "instructions",
        "instructions.app",
    ]) {
        const intro = await container.readText(
            path.join(cwd, `.docs/${introname}.md`)
        )
        if (intro) instructions += intro + "\n\n"
    }

    let generatedCode = ""
    let testPassed = false
    const res = await runPrompt(
        (ctx) => {
            ctx.$`

## Task 1:

Analyze INSTRUCTIONS and generate Python code that the requirements.

- use Python 3.11
- Use the TEMPLATE code as a starting point and update it to solve the problem. 
You mush NOT change the function signature. Implement the functions.
- do NOT generate unit tests.
- you can only use built-in python libraries. pip packages are not allowed.

## Task 2:

Evaluate the generated code by running the unit tests.

- Use the test_code tool to run the unit tests against the generated code.

## Task 3:

If the tests fail, update the generated code in Task 1 and re-run the tests in Task 1.
If the tests passed, stop.
`

            ctx.def("INSTRUCTIONS", instructions, { language: "markdown" })
            ctx.def("TEMPLATE", { filename }, { language: "python" })

            ctx.defTool(
                "test_code",
                "Run unit tests against generated solution",
                {
                    code: {
                        type: "string",
                        description:
                            "Generated Python code to solve the problem",
                    },
                },
                async ({ code }) => {
                    generatedCode = code
                    console.log(code)
                    await container.writeText(filename, code)
                    const res = await container.exec(
                        `python3.11 -m pytest -o markers=task ${test[0]}`,
                        { cwd }
                    )
                    if (res.exitCode) {
                        console.log(res.stdout || "")
                        console.log(res.stderr || "")
                    } else testPassed = true
                    return res
                },
                { maxTokens: 20000 }
            )
        },
        {
            label: sample,
            applyEdits: true,
            cache: "extrism",
            system: [
                "system",
                "system.explanations",
                "system.python",
                "system.files",
            ],
        }
    )

    await workspace.writeText(
        `${results}/res/${sample}.yaml`,
        YAML.stringify(res)
    )
    if (generatedCode)
        await workspace.writeText(
            `${results}/${testPassed ? "success" : "failed"}/${solution[0]}`,
            generatedCode
        )
})
