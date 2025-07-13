script({
    title: "Summarize links",
    description: "Expands contents from links and summarizes them",
})

$`You are a export technical writer. Summarize the files below.`

def("FILE", env.files)
