gptool({ title: "Default gptool",
         description: "This is the default gptool that assumes the gpspec contains the entire request.",
        categories: ["core"], })

def(“LINKS”, env.links)
def(“TASK”, env.file)

$`The user has defined their task in TASK and provided all the context in LINKS.
Execute the tasks as specified in TASK.`