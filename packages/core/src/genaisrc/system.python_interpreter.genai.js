system({
    title: "Python Dockerized code execution",
})

const image = env.vars.pythonImage ?? "python:alpine"

defTool(
    "python_interpreter",
    "Executes python code in a docker container",
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
    async ({ requirements, main }) => {
        console.log(`python: running code...`)
        const container = await host.container({ image })
        try {
            if (requirements) {
                await container.writeText("requirements.txt", requirements)
                await container.exec("python", [
                    "pip",
                    "install",
                    "-r",
                    "requirements.txt",
                ])
            }

            await container.writeText("main.py", main)
            const res = await container.exec("python", ["main.py"])
            return res
        } finally {
            await container.stop()
        }
    }
)
