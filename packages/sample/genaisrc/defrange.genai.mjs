script({
    model: "large",
    files: "src/templates/basic.prompty",
    tests: {
        keywords: ["CORRECT1", "CORRECT2", "CORRECT3"],
    },
})

def("START", env.files, { lineStart: 29 })
def("END", env.files, { lineEnd: 40 })
def("RANGE", env.files, { lineStart: 29, lineEnd: 40 })

$`- Respond CORRECT1 if the content of START starts with "system:" otherwise INCORRECT1
- Respond CORRECT2 if the content of END ends with "user:" otherwise INCORRECT2
- Respond CORRECT3 if the content of RANGE starts with "system:" and ends with "user:" otherwise INCORRECT3`
