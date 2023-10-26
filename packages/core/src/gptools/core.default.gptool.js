gptool({
        title: "Run gpspec directly",
        description: "This is the default gptool that assumes the gpspec contains the entire request.",
        categories: ["core"],
})

def("LINKS", env.links)
def("TASK", env.file)


$`The user has defined their task in TASK and provided all the context in LINKS.
Execute the task as specified in TASK.  If the location of the output is not specified
append it to file ${env.file.filename}.  Do not overwrite the original contents.`