gptool({
    title: "Code Patches",
    description:
        "Optimize code to run faster, modified from https://twitter.com/mattshumer_/status/1719403205950349588.",
    maxTokens: 2000,
    categories: ["samples"],
    system: ["system.functions"],
})

defFunction("update_file", "Describes an update (patch) of a file.", {
    "type": "object",
    "properties": {
        "lineStart": {
            "type": "string",
            "description": "The line number to start the patch.",
        },
        "lineEnd": {
            "type": "string",
            "description": "The line number to end the patch.",
        },
        "content": {
            "type": "string",
            "description": "The content to replace the patch with. If not provided, the patch will be deleted.",
        }
    },
    "required": ["lineStart", "lineEnd"],
}, (args) => {
    const { output, lineStart, lineEnd, content } = args
    output.log(`[${lineStart}-${lineEnd}] ${content || ""}`)
    return ''
})

// Modified from https://twitter.com/mattshumer_/status/1719403205950349588?s=46
def("FILE", env.links, { lineNumbers: true })

$`
You are a world expert in making code run faster. You use any resource you can to do so.

Given some code in FILE files, identify how long it might take to run.
After that, identify which parts are key candidates to speed up.
After that, order the candidates by ranking.

Take the top-ranked candidate and update the code in the file to be faster.
Do not explain your reasoning, just update the code.
`
