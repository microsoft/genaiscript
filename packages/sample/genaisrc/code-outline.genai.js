script({
    title: "code outline",
})

const outline = await retreival.outline(env.files)

def("CODE", outline)

$`Summarize the code in OUTLINE.`
