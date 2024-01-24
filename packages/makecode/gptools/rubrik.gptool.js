gptool({
    title: "rubrik",
    description: "Evaluate a rubrik for a MakeCode Arcade project",
    categories: ["MakeCode"],
    system: ["system", "system.explanations", "system.files"],
    urlAdapters: [{
        contentType: "application/json",
        matcher: (url) => {
            const m = /^https:\/\/makecode.com\/(_\w{12,})$/i.exec(url)
            return m
                ? `https://arcade.makecode.com/api/${m[1]}/text`
                : undefined
        },
        adapter: body => body["main.ts"]
    }],
})

// use $ to output formatted text to the prompt
$`You are an expert computer science educator for K12 students. 
You are an expert at the MakeCode Arcade editor.

For each PROJECT, assess the rubrics listed in FILE and evalute if the project meets the criteria.

Format the answer as follows:

\`\`\`markdown
### <rubric name>

OK or NOT OK. Explain your answer.

### <rubric name 2>

OK or NOT OK. Explain your answer.

## <project name 2> <project url 2>

...
\`\`\`

Finally, suggest how to improve the project.

`

def("FILE", env.context)
def(
    "PROJECT",
    env.files.filter((f) => /^https:\/\/makecode.com\//.test(f.filename), {
        lineNumbers: true,
    })
)
