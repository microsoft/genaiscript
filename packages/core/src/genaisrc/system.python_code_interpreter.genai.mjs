system({
    title: "Python Dockerized code execution for data analysis",
})

const image = env.vars.pythonImage ?? "python:3.12"
const packages = ["numpy", "pandas", "scipy"]

const queue = host.promiseQueue(1)

/** @type {ContainerHost} */
let _container = null

/** @type {Promise<ContainerHost>} */
const getContainer = queue.add(async () => {
    if (!_container) {
        console.log(`python: preparing container...`)
        _container = await host.container({
            image,
            networkEnabled: true,
        })
        const res = await _container.exec("pip", [
            "install",
            "--root-user-action",
            "ignore",
            ...packages,
        ])
        if (res.failed) throw new Error(`Failed to install requirements`)
        await _container.disconnect()
    }
    return _container
})

defTool(
    "python_code_interpreter_run",
    "Executes python 3.12 code for Data Analysis tasks in a docker container. The process output is returned. Do not generate visualizations. The only packages available are numpy, pandas, scipy. There is NO network connectivity. Do not attempt to install other packages or make web requests.",
    {
        main: {
            type: "string",
            description: "python 3.12 source code to execute",
        },
        required: ["main"],
    },
    async (args) => {
        const { context, main = "" } = args
        context.log(`python code interpreter: run`)
        const container = await getContainer
        return await queue.add(async () => {
            await container.writeText("main.py", main)
            const res = await container.exec("python", ["main.py"])
            return res
        })
    }
)

defTool(
    "python_code_interpreter_copy_files",
    "Copy files from the host file system to the container file system",
    {
        from: {
            type: "string",
            description: "Host file path",
        },
        to: {
            type: "string",
            description: "Container file path",
        },
        required: ["from"],
    },
    async (args) => {
        const { context, from, to = "" } = args
        context.log(`python code interpreter: cp ${from} ${to}`)
        const container = await getContainer
        return await queue.add(async () => {
            await container.copyTo(from, to)
            return "OK"
        })
    }
)
