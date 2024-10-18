system({
    title: "Python Dockerized code execution for data analysis",
})

const image = env.vars.pythonImage ?? "python:3.12"
const packages = ["numpy", "pandas", "scipy"]

const getContainer = async () =>
    await host.container({
        name: "python",
        persistent: true,
        image,
        postCreateCommands: `pip install --root-user-action ignore ${packages.join(" ")}`,
    })

defTool(
    "python_code_interpreter_run",
    "Executes python 3.12 code for Data Analysis tasks in a docker container. The process output is returned. Do not generate visualizations. The only packages available are numpy, pandas, scipy. There is NO network connectivity. Do not attempt to install other packages or make web requests. You must copy all the necessary files or pass all the data because the python code runs in a separate container.",
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
        const { context, main = "" } = args
        context.log(`python: exec`)
        context.debug(main)
        const container = await getContainer()
        return await container.scheduler.add(async () => {
            await container.writeText("main.py", main)
            const res = await container.exec("python", ["main.py"])
            return res
        })
    }
)

defTool(
    "python_code_interpreter_copy_files_to_container",
    "Copy files from the host file system to the container file system. NO absolute paths. Returns the path of each file copied in the container.",
    {
        type: "object",
        properties: {
            from: {
                type: "string",
                description: "Host file path",
            },
            toFolder: {
                type: "string",
                description:
                    "Container directory path. Default is '.'  Not a filename.",
            },
        },
        required: ["from"],
    },
    async (args) => {
        const { context, from, toFolder = "." } = args
        context.log(`python: cp ${from} ${toFolder}`)
        const container = await getContainer()
        const res = await container.scheduler.add(
            async () => await container.copyTo(from, toFolder)
        )
        return res.join("\n")
    }
)

defTool(
    "python_code_interpreter_read_file",
    "Reads a file from the container file system. No absolute paths.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "Container file path",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { context, filename } = args
        context.log(`python: cat ${filename}`)
        const container = await getContainer()
        const res = await container.scheduler.add(
            async () => await container.readText(filename)
        )
        return res
    }
)
