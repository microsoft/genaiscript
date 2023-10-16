prompt({
    title: "Code Summarizer",
    description: "Given a source file in a programming language, extract the structure"
})

const { text: content } = await fetchText("https://raw.githubusercontent.com/microsoft/devicescript/main/packages/drivers/src/driver.ts")

def("FILE", { filename: "drivers.ts", content, label: "DeviceScript drivers" })

$`You are an expert at programming in all known languages.
For each FILE 'filename.extension', generate a summarized FILE 'filename.s.extension' that ignores the internal details
of the implementation and extracts enough information for an LLM to use the code elements
in the source file. Generate comments as needed.`