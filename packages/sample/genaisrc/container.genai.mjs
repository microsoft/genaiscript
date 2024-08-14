script({
    model: "gpt-3.5-turbo",
    tests: {
        keywords: ["Python", "3."],
    },
})

const disablePurge = env.vars.purge === "no"
const container = await host.container({ disablePurge, networkEnabled: true })
const version = await container.exec("python", ["--version"])
if (!/^python \d/i.test(version.stdout))
    throw new Error("python --version failed")
await container.disconnect()
const pipfailed = await container.exec("pip", ["install", "pandas"])
if (!pipfailed.failed) throw new Error("network not disconnected")
await container.writeText("pythonversion.txt", version.stdout)
const fversion = await container.readText("pythonversion.txt")
if (version.stdout !== fversion)
    throw new Error(
        `writetext/readtext error, expected '${version.stdout}', got '${fversion}'`
    )
await container.copyTo("src/rag/*", "copied")
if (!(await container.readText("copied/src/rag/markdown.md")))
    throw new Error("copy failed")
await container.writeText("main.py", 'print("hello")')
const hello = await container.exec("python", ["main.py"])
if (hello.exitCode) throw new Error("python script failed")
defTool(
    "python_version",
    "determines the version of python on this system",
    {},
    async () => {
        const version = await container.exec("python", ["--version"])
        return version.stdout?.replace(/^python\s/i, "") || "?"
    }
)
$`What is the version of python on this machine?`
