system({
    title: "Python Dockerized code execution",
})

const image = env.vars.pythonImage ?? "python:3"

let container = null

defTool(
    "python_interpreter",
    "Executes python 3 code in a docker container. The process output is returned. Use 'print' to output data.",
    {
        type: "object",
        properties: {
            requirements: {
                type: "string",
                description:
                    `list of pip packages and versions to install using pip. should be using the pip install format: 
<package1>===<version1>
<package2>===<version2>
`
            },
            main: {
                type: "string",
                description: "python 3 source code to execute",
            },
        },
        required: ["requirements", "main"],
    },
    async (args) => {
        const { requirements, main = "" } = args
        console.log(`python: running code...`)
        container = await host.container({ image, networkEnabled: true })
        if (requirements) {
            console.log(`installing: ` + requirements)
            await container.writeText("requirements.txt", requirements.replace(/[ ,]\s*/g, "\n"))
            await container.exec("pip", [
                "install",
                "--root-user-action",
                "ignore",
                "-r",
                "requirements.txt",
            ])
        }

        console.log(`code: ` + main)
        await container.writeText("main.py", main)
        const res = await container.exec("python", ["main.py"])
        return res
    }
)
