script({
    model: "small",
    files: "src/templates/basic.prompty",
    tests: {
        keywords: ["CORRECT1", "CORRECT2", "CORRECT3"],
    },
})

def("START", env.files, { lineStart: 23 })
def("END", env.files, { lineEnd: 27 })

def("RANGE", env.files, { lineStart: 23, lineEnd: 27 })

$`Respond CORRECT1 if START start with "system:" otherwise INCORRECT`
$`Respond CORRECT2 if END end with "user:" otherwise INCORRECT`
$`Respond CORRECT3 if RANGE start with "system:" and end with "user:" otherwise INCORRECT`
