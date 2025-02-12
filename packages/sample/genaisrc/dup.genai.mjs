script({})
def("FILE", "hello world")
def("FILE", "hello world")

defOutputProcessor((output) => {
    const msg = output.messages.find((m) => m.role === "user")
    console.log({ msg })
    const fileCount = (msg.content.match(/<FILE>/g) || []).length
    if (fileCount > 2) throw new Error("Too many files")
})
