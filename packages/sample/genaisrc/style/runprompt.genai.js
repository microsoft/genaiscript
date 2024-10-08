script({
    model: "openai:gpt-4o-mini",
    tests: {},
})

const r = await prompt`write a haiku poem`
if (r.error) throw r.error
const r2 = await runPrompt(`write a haiku poem`)
if (r2.error) throw r2.error
const r3 = await runPrompt(() => `write a haiku poem`)
if (r3.error) throw r3.error

const resPoem = await runPrompt(
    (_) => {
        _.$`write haiku poem`
    },
    {
        model: "openai:gpt-3.5-turbo",
        label: "generate poem",
        system: ["system"],
    }
)
if (resPoem.error) throw resPoem.error

const resJSON = await runPrompt(
    (_) => {
        _.$`generate 3 random numbers between 1 and 10 and respond in JSON`
    },
    {
        model: "openai:gpt-3.5-turbo",
        label: "generate json",
        responseType: "json_object",
    }
)
if (resJSON.error) throw resJSON.error

$`Is this poetry? Respond yes or no.`
fence(resPoem.text)

$`Is this JSON? Respond yes or no.`
fence(resJSON.text)

const { text, fileEdits } = await runPrompt(
    (_) => {
        _.$`Create a file named "test.txt" with the following content: "hello world"`
        _.defOutputProcessor((output) => {
            console.log(`processing output: ${output.text}`)
            return { text: output.text + "\n<processed>" }
        })
        _.defFileMerge((filename, label, before, after) => {
            console.log({ filename, label, before, after })
            if (path.basename(filename) !== "test.txt")
                throw new Error("wrong file name")
            return after + "\n<merged>"
        })
    },
    { applyEdits: true, label: "outputs", system: ["system", "system.files"] }
)
console.log(text)
console.log(YAML.stringify(fileEdits))
if (!fileEdits?.["test.txt"]?.after?.includes("hello world"))
    throw new Error("File not created")
if (!text.includes("<processed>"))
    throw new Error("output processor did not run")
if (!fileEdits?.["test.txt"]?.after?.includes("<merged>"))
    throw new Error("file merge did not run")
