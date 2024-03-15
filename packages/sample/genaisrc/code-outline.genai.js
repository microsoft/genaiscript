script({
    title: "code outline",
})

const outline = await retreival.outline(env.files)
const code = def("CODE", outline)

$`Summarize the code in ${code}.`
