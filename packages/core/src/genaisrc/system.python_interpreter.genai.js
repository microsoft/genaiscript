system({
    title: "Python Dockerized code execution",
})

const image = env.vars.pythonImage ?? "python:3"

let container = null

defTool(
    "python_interpreter",
    "Executes python code in a docker container. The process output is returned.",
    {
        type: "object",
        properties: {
            requirements: {
                type: "string",
                description: "pip install requirements.txt file to install",
            },
            main: {
                type: "string",
                description: "python source code to execute",
            },
        },
        required: ["requirements", "main"],
    },
    async (args) => {
        const { requirements, main = "" } = args
        console.log(`python: running code...`)
        container = await host.container({ image })
        if (requirements) {
            console.log(`installing: ` + requirements.replace(/\n/g, ", "))
            await container.writeText("requirements.txt", requirements)
            await container.exec("pip", [
                "install",
                "--no-cache-dir",
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
