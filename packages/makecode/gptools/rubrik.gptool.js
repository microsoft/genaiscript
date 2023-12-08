gptool({
    title: "rubrik",
    description: "Evaluate a rubrik for a MakeCode Arcade project",
    categories: ["MakeCode"],
})

// use $ to output formatted text to the prompt
$`You are an expert computer science educator for K12 students. 
You are an expert at the MakeCode Arcade editor.

For each PROJECT, assess the rubrics listed in FILE and evalute if the project meets the criteria.

`

def("FILE", env.file)
const projects = env.links.filter((f) => /^https:\/\/makecode.com\//.test(f.filename))
console.log(projects)
for(const project of projects) {
    console.log(project)
    const id = project.filename.replace(/^https:\/\/makecode.com\//, "")
    console.log(id)
    const res = await fetchText(`https://arcade.makecode.com/api/${id}/text`)
    def("PROJECT", res.text)
}
