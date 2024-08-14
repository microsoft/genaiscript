system({
    title: "Python Dockerized code execution for data analysis",
})

const image = env.vars.pythonImage ?? "python:3.12"
const packages = ["numpy", "pandas", "scipy"]

let container = null

defTool(
    "python_code_interpreter",
    "Executes python 3.12 code for Data Analysis tasks in a docker container. The process output is returned. Do not generate visualizations. The only packages available are numpy, pandas, scipy. There is NO network connectivity. Do not attempt to install other packages or make web requests.",
    {
        type: "object",
        properties: {
            main: {
                type: "string",
                description: "python 3.12 source code to execute",
            },
        },
        required: ["main"],
    },
    async (args) => {
        const { main = "" } = args
        console.log(`python code interpreter: ` + main)
        if (!container) {
            console.log(`python: preparing container...`)
            container = await host.container({ image, networkEnabled: true })
            const res = await container.exec("pip", [
                "install",
                "--root-user-action",
                "ignore",
                ...packages,
            ])
            if (res.failed) throw new Error(`Failed to install requirements`)
            await container.disconnect()
        }

        await container.writeText("main.py", main)
        const res = await container.exec("python", ["main.py"])
        return res
    }
)
