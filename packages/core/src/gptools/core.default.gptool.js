gptool({
        title: "Run gpspec directly",
        description: "This is the default gptool that assumes the gpspec contains the entire request.",
        categories: ["core"],
})

def("LINKS", env.links)
def("TASK", env.file)


$`The user has defined their task in TASK and provided all the context in LINKS.
Execute the task as specified in TASK.  Pay careful attention to the type of file the user wants to generate as output and what file it should be written to.
Only if the location of the output is not specified in TASK, append it to file ${env.file.filename}.  In that case, do not overwrite the original contents of ${env.file.filename}.`