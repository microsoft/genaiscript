gptool({
    title: 'GPTool metadata generator',
    description: 'Generates metadata for GPTools',
    categories: ["samples"],
})

def("SCRIPTS", env.links)

$`You are an expert in GPTool scripts; a script language for creating LLM tools written in Javascript. SCRIPTS files is a list of gptool files.

Generate a 'title' and 'description' for each SCRIPTS files in yaml format. Update the 'title' and 'description' fields in the 'gptool' function call.

-   refer to scripts as gptool.
-   be concise and descriptive.
-   do not change the rest of the file.
`