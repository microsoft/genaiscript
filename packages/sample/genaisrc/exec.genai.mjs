script({
    model: "small",
    tests: {
        keywords: ["Python", "3."],
    },
})
const version = await host.exec("python", ["--version"])
if (!/^python \d/i.test(version.stdout))
    throw new Error("python --version failed")
def("VERSION", version)
defTool(
    "python_version",
    "determines the version of python on this system",
    {},
    async (_) => {
        console.debug(`determining python version`)
        const version = await host.exec("python", ["--version"])
        return version.stdout?.replace(/^python\s/i, "") || "?"
    }
)
$`What is the version of python on this machine?`
