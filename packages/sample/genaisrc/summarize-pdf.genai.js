script({
    title: "summarize pdf"
})

const { file } = await parsers.PDF(env.files[0].filename)

def("FILE", file)

$`Summarize the content of FILE.`